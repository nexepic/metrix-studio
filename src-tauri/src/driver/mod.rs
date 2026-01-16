mod ffi;

use crate::models::{GraphEdge, GraphNode, QueryResult};
use ffi::*;
use log::{debug, error, info, trace, warn};
use std::ffi::{CStr, CString};
use std::ptr;
use std::time::Instant;

pub struct MetrixDB {
    ptr: *mut MetrixDB_T,
}

// Safety: Assert that the C++ pointer is thread-safe
unsafe impl Send for MetrixDB {}
unsafe impl Sync for MetrixDB {}

impl MetrixDB {
    /// Opens the database safely with null pointer checks.
    pub fn open(path: &str) -> Result<Self, String> {
        let c_path = CString::new(path).map_err(|_| "Invalid path string")?;
        let ptr = unsafe { metrix_open(c_path.as_ptr()) };

        if ptr.is_null() {
            return Err(Self::get_last_error());
        }
        Ok(Self { ptr })
    }

    pub fn open_if_exists(path: &str) -> Result<Self, String> {
        let c_path = CString::new(path).map_err(|_| "Invalid path string")?;

        let ptr = unsafe { metrix_open_if_exists(c_path.as_ptr()) };

        // If C++ returns nullptr, this block MUST trigger
        if ptr.is_null() {
            let err_msg = Self::get_last_error();
            println!("[Rust-Driver] Pointer is NULL. Error from C++: {}", err_msg);
            return Err(err_msg);
        }

        Ok(Self { ptr })
    }

    /// Execute a Cypher query.
    pub fn execute(&self, cypher: &str) -> Result<QueryResult, String> {
        info!("Executing Cypher: {}", cypher);

        // 1. Prepare the query string for the C API
        let c_cypher =
            CString::new(cypher).map_err(|_| "Invalid query string (contains null byte)")?;
        let start = Instant::now();

        // 2. Call the C API to execute the query
        // This returns a pointer to a Result object.
        let res_ptr = unsafe { metrix_execute(self.ptr, c_cypher.as_ptr()) };

        // 3. System-level check: Did the C function itself fail to allocate the Result object?
        if res_ptr.is_null() {
            let system_err = Self::get_last_error();
            error!(
                "System Failure: metrix_execute returned NULL. Details: {}",
                system_err
            );
            return Err(system_err);
        }

        unsafe {
            // 4. Logic-level check: Did the engine encounter a Syntax or Runtime error?
            // Even if res_ptr is valid, the query inside might have failed.
            if !metrix_result_is_success(res_ptr) {
                let err_ptr = metrix_result_get_error(res_ptr);
                let err_msg = if err_ptr.is_null() {
                    "Unknown database execution error".to_string()
                } else {
                    CStr::from_ptr(err_ptr).to_string_lossy().into_owned()
                };

                // CRITICAL: Must close the result handle to prevent memory leaks in C++
                metrix_result_close(res_ptr);

                error!("Database Execution Error: {}", err_msg);
                return Err(err_msg);
            }

            // 5. Successful Execution: Start parsing data
            let mut result = QueryResult::default();

            // 5a. Extract Metadata (Column Names)
            let col_count = metrix_result_column_count(res_ptr);
            debug!("Execution successful. Columns found: {}", col_count);

            for i in 0..col_count {
                let name_ptr = metrix_result_column_name(res_ptr, i);
                let name = if name_ptr.is_null() {
                    format!("col_{}", i)
                } else {
                    CStr::from_ptr(name_ptr).to_string_lossy().into_owned()
                };
                result.columns.push(name);
            }

            // 5b. Iterate through the rows and parse values
            let mut row_count = 0;
            while metrix_result_next(res_ptr) {
                row_count += 1;
                let mut row_data = Vec::with_capacity(col_count as usize);

                for i in 0..col_count {
                    let val_type = metrix_result_get_type(res_ptr, i);

                    // Route to appropriate parser based on C-enum type
                    let json_val = match val_type {
                        MetrixValueType::MX_NODE => self.parse_node(res_ptr, i, &mut result.nodes),
                        MetrixValueType::MX_EDGE => self.parse_edge(res_ptr, i, &mut result.edges),
                        MetrixValueType::MX_STRING => {
                            let s_ptr = metrix_result_get_string(res_ptr, i);
                            if s_ptr.is_null() {
                                serde_json::Value::String("".to_string())
                            } else {
                                serde_json::Value::String(
                                    CStr::from_ptr(s_ptr).to_string_lossy().into_owned(),
                                )
                            }
                        }
                        MetrixValueType::MX_INT => {
                            serde_json::json!(metrix_result_get_int(res_ptr, i))
                        }
                        MetrixValueType::MX_DOUBLE => {
                            serde_json::json!(metrix_result_get_double(res_ptr, i))
                        }
                        MetrixValueType::MX_BOOL => {
                            serde_json::json!(metrix_result_get_bool(res_ptr, i))
                        }
                        MetrixValueType::MX_NULL => serde_json::Value::Null,
                    };
                    row_data.push(json_val);
                }
                result.rows.push(row_data);
            }

            // 6. Cleanup result handle and record performance metrics
            metrix_result_close(res_ptr);

            debug!("Scan finished. Rows extracted: {}", row_count);
            result.duration_ms = start.elapsed().as_millis();

            Ok(result)
        }
    }

    // --- Internal Helpers ---

    fn get_last_error() -> String {
        unsafe {
            let err_ptr = metrix_get_last_error();
            if err_ptr.is_null() {
                // Fallback 1: Pointer is null
                return "Database file not found or access denied".to_string();
            }

            let err_str = CStr::from_ptr(err_ptr).to_string_lossy().into_owned();

            if err_str.trim().is_empty() {
                // Fallback 2: Pointer is valid but string is empty
                return "An unknown error occurred while validating the database.".to_string();
            }

            err_str
        }
    }

    unsafe fn parse_node(
        &self,
        res: *mut MetrixResult_T,
        col: i32,
        list: &mut Vec<GraphNode>,
    ) -> serde_json::Value {
        let mut raw = MetrixNode {
            id: 0,
            label: ptr::null(),
        };
        if metrix_result_get_node(res, col, &mut raw) {
            let props = self.parse_props(res, col);
            let label = if !raw.label.is_null() {
                CStr::from_ptr(raw.label).to_string_lossy().into_owned()
            } else {
                "Node".to_string()
            };

            let node = GraphNode {
                id: raw.id,
                label,
                properties: props,
            };
            list.push(node);
            return serde_json::json!({ "_type": "node", "id": raw.id });
        }
        serde_json::Value::Null
    }

    unsafe fn parse_edge(
        &self,
        res: *mut MetrixResult_T,
        col: i32,
        list: &mut Vec<GraphEdge>,
    ) -> serde_json::Value {
        let mut raw = MetrixEdge {
            id: 0,
            source_id: 0,
            target_id: 0,
            type_: ptr::null(),
        };
        if metrix_result_get_edge(res, col, &mut raw) {
            let props = self.parse_props(res, col);
            let label = if !raw.type_.is_null() {
                CStr::from_ptr(raw.type_).to_string_lossy().into_owned()
            } else {
                "Edge".to_string()
            };

            let edge = GraphEdge {
                id: raw.id,
                source: raw.source_id,
                target: raw.target_id,
                label,
                properties: props,
            };
            list.push(edge);
            return serde_json::json!({ "_type": "edge", "id": raw.id });
        }
        serde_json::Value::Null
    }

    unsafe fn parse_props(&self, res: *mut MetrixResult_T, col: i32) -> serde_json::Value {
        let ptr = metrix_result_get_props_json(res, col);
        if ptr.is_null() {
            return serde_json::json!({});
        }
        serde_json::from_str(&CStr::from_ptr(ptr).to_string_lossy())
            .unwrap_or(serde_json::json!({}))
    }
}

// Ensure cleanup
impl Drop for MetrixDB {
    fn drop(&mut self) {
        if !self.ptr.is_null() {
            unsafe { metrix_close(self.ptr) };
        }
    }
}
