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
    nodes: GraphNode[];
    edges: GraphEdge[];
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