import { createContext, useContext, useState, ReactNode } from 'react';
import { GraphNode, GraphEdge, HistoryItem, QueryResult } from '@/types';
import { invoke } from '@tauri-apps/api/core';

// --- Type Definitions ---
interface AppState {
    // --- Connection State ---
    dbPath: string | null;
    isConnected: boolean;

    // --- Left Layout State ---
    activeLeftTab: 'explorer' | 'search' | 'settings';
    isLeftSidebarOpen: boolean;
    toggleLeftSidebar: (tab: 'explorer' | 'search' | 'settings') => void;

    // --- Right Layout State (Split Pane) ---
    // Top Slot: Can hold 'properties' OR 'history' (mutually exclusive)
    activeTopPanel: 'properties' | 'history' | null;
    // Bottom Slot: Can hold 'analysis'
    activeBottomPanel: 'analysis' | null;
    // Computed: True if either slot has an active panel
    isRightSidebarOpen: boolean;

    toggleTopPanel: (panel: 'properties' | 'history') => void;
    toggleBottomPanel: (panel: 'analysis') => void;

    // --- Data State ---
    query: string;
    graphData: { nodes: GraphNode[]; links: GraphEdge[] };
    selectedElement: GraphNode | GraphEdge | null;
    selectionType: 'node' | 'edge' | null;
    history: HistoryItem[];

    // --- Actions ---
    connectDatabase: (path: string) => Promise<void>;
    disconnectDatabase: () => Promise<void>;
    runQuery: () => Promise<void>;
    setQuery: (q: string) => void;
    setSelection: (el: GraphNode | GraphEdge | null, type: 'node' | 'edge' | null) => void;
}

// Create Context
const AppContext = createContext<AppState | undefined>(undefined);

// --- Provider Implementation ---
export const AppProvider = ({ children }: { children: ReactNode }) => {

    // --- Data State ---
    const [dbPath, setDbPath] = useState<string | null>(null);
    const [query, setQuery] = useState("MATCH (n)-[r]->(m) RETURN n,r,m LIMIT 50");
    const [graphData, setGraphData] = useState<{ nodes: GraphNode[]; links: GraphEdge[] }>({ nodes: [], links: [] });
    const [history, setHistory] = useState<HistoryItem[]>([]);

    // Selection State
    const [selectedElement, setSelectedElement] = useState<GraphNode | GraphEdge | null>(null);
    const [selectionType, setSelectionType] = useState<'node' | 'edge' | null>(null);

    // --- Layout State ---
    const [activeLeftTab, setActiveLeftTab] = useState<'explorer' | 'search' | 'settings'>('explorer');
    const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(true);

    // Right Sidebar (Split View)
    const [activeTopPanel, setActiveTopPanel] = useState<'properties' | 'history' | null>('properties');
    const [activeBottomPanel, setActiveBottomPanel] = useState<'analysis' | null>(null);

    // Computed: Is the container open?
    const isRightSidebarOpen = activeTopPanel !== null || activeBottomPanel !== null;

    // --- Layout Actions ---

    const toggleLeftSidebar = (tab: 'explorer' | 'search' | 'settings') => {
        if (activeLeftTab === tab) {
            setIsLeftSidebarOpen(!isLeftSidebarOpen);
        } else {
            setActiveLeftTab(tab);
            setIsLeftSidebarOpen(true);
        }
    };

    const toggleTopPanel = (panel: 'properties' | 'history') => {
        if (activeTopPanel === panel) {
            setActiveTopPanel(null); // Close if clicking active
        } else {
            setActiveTopPanel(panel); // Switch to new
        }
    };

    const toggleBottomPanel = (panel: 'analysis') => {
        if (activeBottomPanel === panel) {
            setActiveBottomPanel(null); // Close if clicking active
        } else {
            setActiveBottomPanel(panel); // Open
        }
    };

    // --- Data Actions ---

    const connectDatabase = async (path: string) => {
        try {
            await invoke("open_database", { path });
            setDbPath(path);
        } catch (e) {
            console.error("Connection failed", e);
            throw e;
        }
    };

    const disconnectDatabase = async () => {
        await invoke("close_database");
        setDbPath(null);
        setGraphData({ nodes: [], links: [] });
    };

    const runQuery = async () => {
        if (!dbPath) return;
        const start = Date.now();
        try {
            const res = await invoke<QueryResult>("run_query", {query});

            const processedData = {
                nodes: res.nodes.map(n => ({...n, val: 5})),
                links: res.edges.map(e => ({...e}))
            };
            setGraphData(processedData);

            setHistory(prev => [{
                id: crypto.randomUUID(),
                query,
                timestamp: Date.now(),
                status: 'success',
                duration: res.duration_ms,
                resultCount: res.nodes.length // Assuming QueryResult has this
            }, ...prev]);
        } catch (e) {
            console.error(e);

            const errorDuration = Date.now() - start;

            setHistory(prev => [{
                id: crypto.randomUUID(),
                query,
                timestamp: Date.now(),
                status: 'error',
                duration: errorDuration,
                resultCount: 0
            }, ...prev]);
        }
    };

    const setSelection = (el: GraphNode | GraphEdge | null, type: 'node' | 'edge' | null) => {
        setSelectedElement(el);
        setSelectionType(type);

        // Auto-UX: If user selects an item, make sure the Properties panel is visible
        if (el) {
            setActiveTopPanel('properties');
        }
    };

    // --- Render ---
    return (
        <AppContext.Provider value={{
            // Connection
            dbPath, isConnected: !!dbPath,
            connectDatabase, disconnectDatabase,

            // Left Layout
            activeLeftTab, isLeftSidebarOpen, toggleLeftSidebar,

            // Right Layout (Split Pane)
            activeTopPanel, activeBottomPanel, isRightSidebarOpen,
            toggleTopPanel, toggleBottomPanel,

            // Data
            query, setQuery, runQuery,
            graphData,
            selectedElement, selectionType, setSelection,
            history
        }}>
            {children}
        </AppContext.Provider>
    );
};

// --- Custom Hook ---
export const useApp = () => {
    const context = useContext(AppContext);
    if (!context) throw new Error("useApp must be used within AppProvider");
    return context;
};