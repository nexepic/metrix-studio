#![allow(non_upper_case_globals)]
#![allow(non_camel_case_types)]
#![allow(non_snake_case)]
#![allow(unused_imports)]

use log::{debug, error, info, trace, warn};
use serde::Serialize;
use std::ffi::{CStr, CString};
use std::ptr;
use std::time::Instant;

mod ffi {
    #![allow(dead_code)]
    include!(concat!(env!("OUT_DIR"), "/bindings.rs"));
}
use ffi::*;

// --- DTOs (Data Transfer Objects) ---

#[derive(Serialize, Debug, Clone)]
pub struct GraphNode {
    pub id: i64,
    pub label: String,
    pub properties: serde_json::Value,
}

#[derive(Serialize, Debug, Clone)]
pub struct GraphEdge {
    pub id: i64,
    pub source: i64,   // Source Node ID
    pub target: i64,   // Target Node ID
    pub label: String, // Relationship Type
    pub properties: serde_json::Value,
}

#[derive(Serialize, Debug, Default)]
pub struct QueryResult {
    pub columns: Vec<String>,
    pub rows: Vec<Vec<serde_json::Value>>,
    pub nodes: Vec<GraphNode>,
    pub edges: Vec<GraphEdge>,
    pub duration_ms: u128,
}

// --- Database Wrapper ---

pub struct MetrixDb {
    ptr: *mut MetrixDB_T,
}

unsafe impl Send for MetrixDb {}
unsafe impl Sync for MetrixDb {}

impl MetrixDb {
    /// Open the database. Logs at INFO level.
    pub fn open(path: &str) -> Result<Self, String> {
        info!("Opening database at path: {}", path);

        let c_path = CString::new(path).map_err(|_| "Invalid path")?;
        let ptr = unsafe { metrix_open(c_path.as_ptr()) };

        if ptr.is_null() {
            let err = Self::get_last_error();
            error!("Failed to open database: {}", err);
            return Err(err);
        }

        info!("Database opened successfully.");
        Ok(Self { ptr })
    }

    /// Execute Cypher query. Logs summary at INFO, details at DEBUG/TRACE.
    pub fn execute(&self, cypher: &str) -> Result<QueryResult, String> {
        info!("Executing Cypher: {}", cypher);

        let c_cypher = CString::new(cypher).map_err(|_| "Invalid query")?;
        let start = Instant::now();

        // Call C API
        let res_ptr = unsafe { metrix_execute(self.ptr, c_cypher.as_ptr()) };

        if res_ptr.is_null() {
            let err = Self::get_last_error();
            error!("Execution failed: {}", err);
            return Err(err);
        }

        let mut result = QueryResult::default();

        unsafe {
            // 1. Get Metadata
            let col_count = metrix_result_column_count(res_ptr);
            debug!("Result column count: {}", col_count);

            for i in 0..col_count {
                let name_ptr = metrix_result_column_name(res_ptr, i);
                let name = CStr::from_ptr(name_ptr).to_string_lossy().into_owned();
                result.columns.push(name);
            }

            // 2. Iterate Rows
            let mut row_count = 0;
            while metrix_result_next(res_ptr) {
                row_count += 1;
                // Optimization: reserve memory if column count is known
                let mut row_data = Vec::with_capacity(col_count as usize);

                for i in 0..col_count {
                    let val_type = metrix_result_get_type(res_ptr, i);

                    // Trace level logging: Only visible when RUST_LOG=trace
                    // This replaces the noisy println! inside the loop
                    trace!("Row {} Col {} Type: {:?}", row_count, i, val_type);

                    let json_val = match val_type {
                        MetrixValueType::MX_NODE => {
                            // Extract Node Logic
                            self.parse_node(res_ptr, i, &mut result.nodes)
                        }
                        MetrixValueType::MX_EDGE => {
                            // Extract Edge Logic
                            self.parse_edge(res_ptr, i, &mut result.edges)
                        }
                        MetrixValueType::MX_STRING => {
                            let s = CStr::from_ptr(metrix_result_get_string(res_ptr, i));
                            serde_json::Value::String(s.to_string_lossy().into_owned())
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

            metrix_result_close(res_ptr);

            // Log summary at Debug level
            debug!(
                "Scan complete. Rows: {}, Nodes extracted: {}, Edges extracted: {}",
                row_count,
                result.nodes.len(),
                result.edges.len()
            );
        }

        result.duration_ms = start.elapsed().as_millis();
        Ok(result)
    }

    fn get_last_error() -> String {
        unsafe {
            let err_ptr = metrix_get_last_error();
            if err_ptr.is_null() {
                return "Unknown error".to_string();
            }
            let err = CStr::from_ptr(err_ptr).to_string_lossy().into_owned();
            // Log internal errors immediately
            error!("Internal DB Error: {}", err);
            err
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

        // Try to populate the C struct
        if metrix_result_get_node(res, col, &mut raw) {
            let props = self.parse_props(res, col);

            // Safely convert C-String label to Rust String
            let label = if !raw.label.is_null() {
                CStr::from_ptr(raw.label).to_string_lossy().into_owned()
            } else {
                "Node".to_string()
            };

            // --- DEBUG LOGGING ---
            debug!(
                "[Driver] Extracted NODE: ID={}, Label='{}', Props={}",
                raw.id, label, props
            );
            // ---------------------

            let node = GraphNode {
                id: raw.id,
                label,
                properties: props.clone(),
            };
            list.push(node);

            // Return lightweight reference for the table view
            return serde_json::json!({ "_type": "node", "id": raw.id });
        } else {
            // Log warning if C API returned false despite type check passing
            warn!(
                "[Driver] metrix_result_get_node returned FALSE at col {}",
                col
            );
        }
        serde_json::Value::Null
    }

    /// Helper to convert a C Edge result into a Rust struct
    /// Added detailed debug logging to trace data extraction.
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

        // Try to populate the C struct
        if metrix_result_get_edge(res, col, &mut raw) {
            let props = self.parse_props(res, col);

            // Safely convert C-String type to Rust String
            let label = if !raw.type_.is_null() {
                CStr::from_ptr(raw.type_).to_string_lossy().into_owned()
            } else {
                "Edge".to_string()
            };

            // --- DEBUG LOGGING ---
            debug!(
                "[Driver] Extracted EDGE: ID={}, Source={}, Target={}, Type='{}'",
                raw.id, raw.source_id, raw.target_id, label
            );
            // ---------------------

            let edge = GraphEdge {
                id: raw.id,
                source: raw.source_id,
                target: raw.target_id,
                label,
                properties: props.clone(),
            };
            list.push(edge);

            // Return lightweight reference for the table view
            return serde_json::json!({ "_type": "edge", "id": raw.id });
        } else {
            // Log warning if C API returned false despite type check passing
            warn!(
                "[Driver] metrix_result_get_edge returned FALSE at col {}",
                col
            );
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

impl Drop for MetrixDb {
    fn drop(&mut self) {
        if !self.ptr.is_null() {
            info!("Closing database connection.");
            unsafe { metrix_close(self.ptr) };
        }
    }
}
