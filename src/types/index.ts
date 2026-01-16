export interface GraphNode {
    id: number;
    label: string;
    properties: Record<string, any>;
    val?: number;
    color?: string;
}

export interface GraphEdge {
    id: number;
    source: number;
    target: number;
    label: string;
    properties: Record<string, any>;
}

export interface QueryResult {
    // Graph components
    nodes: GraphNode[];
    edges: GraphEdge[];

    // Tabular components
    columns: string[];          // e.g., ["f.path", "func.name"]
    rows: any[][];             // 2D array of result values

    // Metadata
    duration_ms: number;
}

export interface HistoryItem {
    id: string;
    query: string;
    timestamp: number;
    status: 'success' | 'error';
    duration: number;
    resultCount: number;
}