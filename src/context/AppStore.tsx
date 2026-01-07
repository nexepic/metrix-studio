import {createContext, useContext, useState, ReactNode} from 'react';
import {GraphNode, GraphEdge, HistoryItem, QueryResult} from '@/types';
import {invoke} from '@tauri-apps/api/core';

interface AppState {
    // --- Connection State ---
    dbPath: string | null;
    isConnected: boolean;

    // --- Left Layout ---
    activeLeftTab: 'explorer' | 'search' | 'settings';
    isLeftSidebarOpen: boolean;
    toggleLeftSidebar: (tab: 'explorer' | 'search' | 'settings') => void;

    // --- Right Layout (New) ---
    activeRightTab: 'properties' | 'history';
    isRightSidebarOpen: boolean;
    toggleRightSidebar: (tab: 'properties' | 'history') => void;

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

const AppContext = createContext<AppState | undefined>(undefined);

export const AppProvider = ({children}: { children: ReactNode }) => {
    // Data
    const [dbPath, setDbPath] = useState<string | null>(null);
    const [query, setQuery] = useState("MATCH (n)-[r]->(m) RETURN n,r,m LIMIT 50");
    const [graphData, setGraphData] = useState<{ nodes: GraphNode[]; links: GraphEdge[] }>({nodes: [], links: []});
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [selectedElement, setSelectedElement] = useState<GraphNode | GraphEdge | null>(null);
    const [selectionType, setSelectionType] = useState<'node' | 'edge' | null>(null);

    // Layout State
    const [activeLeftTab, setActiveLeftTab] = useState<'explorer' | 'search' | 'settings'>('explorer');
    const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(true);

    const [activeRightTab, setActiveRightTab] = useState<'properties' | 'history'>('properties');
    const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(true);

    const toggleLeftSidebar = (tab: 'explorer' | 'search' | 'settings') => {
        if (activeLeftTab === tab) {
            setIsLeftSidebarOpen(!isLeftSidebarOpen);
        } else {
            setActiveLeftTab(tab);
            setIsLeftSidebarOpen(true);
        }
    };

    const toggleRightSidebar = (tab: 'properties' | 'history') => {
        if (activeRightTab === tab) {
            setIsRightSidebarOpen(!isRightSidebarOpen);
        } else {
            setActiveRightTab(tab);
            setIsRightSidebarOpen(true);
        }
    };

    const connectDatabase = async (path: string) => {
        try {
            // Mock or Real Invoke
            await invoke("open_database", {path});
            setDbPath(path);
        } catch (e) {
            console.error("Connection failed", e);
            throw e;
        }
    };

    const disconnectDatabase = async () => {
        await invoke("close_database");
        setDbPath(null);
        setGraphData({nodes: [], links: []});
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
        if (el) {
            // Auto-open properties on selection
            setActiveRightTab('properties');
            setIsRightSidebarOpen(true);
        }
    };

    return (
        <AppContext.Provider value={{
            dbPath, isConnected: !!dbPath,
            activeLeftTab, isLeftSidebarOpen, toggleLeftSidebar,
            activeRightTab, isRightSidebarOpen, toggleRightSidebar,
            query, setQuery, graphData,
            selectedElement, selectionType, setSelection, history,
            connectDatabase, disconnectDatabase, runQuery
        }}>
            {children}
        </AppContext.Provider>
    );
};

export const useApp = () => {
    const context = useContext(AppContext);
    if (!context) throw new Error("useApp error");
    return context;
};