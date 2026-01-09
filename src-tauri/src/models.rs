use serde::Serialize;

#[derive(Serialize, Debug, Clone)]
pub struct GraphNode {
    pub id: i64,
    pub label: String,
    pub properties: serde_json::Value,
}

#[derive(Serialize, Debug, Clone)]
pub struct GraphEdge {
    pub id: i64,
    pub source: i64,
    pub target: i64,
    pub label: String,
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