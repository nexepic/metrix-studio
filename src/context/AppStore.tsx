import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { GraphNode, GraphEdge, HistoryItem } from '@/types';
import { DatabaseApi } from '@/api/database';

// --- Type Definitions ---
interface AppState {
    // --- Connection State ---
    dbPath: string | null;
    isConnected: boolean;
    recentFiles: string[];

    // --- Left Layout State ---
    activeLeftTab: 'explorer' | 'search' | 'settings';
    isLeftSidebarOpen: boolean;
    toggleLeftSidebar: (tab: 'explorer' | 'search' | 'settings') => void;

    // --- Right Layout State (Split Pane) ---
    activeTopPanel: 'properties' | 'history' | null;
    activeBottomPanel: 'analysis' | null;
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
    createNewDatabase: (parentDir: string, name: string) => Promise<void>;
    disconnectDatabase: () => Promise<void>;
    removeRecentFile: (path: string) => void;
    runQuery: (overrideQuery?: string) => Promise<void>;
    setQuery: (q: string) => void;
    setSelection: (el: GraphNode | GraphEdge | null, type: 'node' | 'edge' | null) => void;
}

const AppContext = createContext<AppState | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
    // --- Core Data State ---
    const [dbPath, setDbPath] = useState<string | null>(null);
    const [query, setQuery] = useState("MATCH (n)-[r]->(m) RETURN n,r,m LIMIT 50");
    const [graphData, setGraphData] = useState<{ nodes: GraphNode[]; links: GraphEdge[] }>({ nodes: [], links: [] });
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [recentFiles, setRecentFiles] = useState<string[]>([]);
    const [selectedElement, setSelectedElement] = useState<GraphNode | GraphEdge | null>(null);
    const [selectionType, setSelectionType] = useState<'node' | 'edge' | null>(null);

    // --- UI Layout State ---
    const [activeLeftTab, setActiveLeftTab] = useState<'explorer' | 'search' | 'settings'>('explorer');
    const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(true);
    const [activeTopPanel, setActiveTopPanel] = useState<'properties' | 'history' | null>('properties');
    const [activeBottomPanel, setActiveBottomPanel] = useState<'analysis' | null>(null);

    // Sidebar is open if at least one panel is active
    const isRightSidebarOpen = activeTopPanel !== null || activeBottomPanel !== null;

    // --- Persistence: Load recents on startup ---
    useEffect(() => {
        const saved = localStorage.getItem('metrix_recents');
        if (saved) {
            try {
                setRecentFiles(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to parse recents from localStorage", e);
            }
        }
    }, []);

    // --- Persistence Helper: Add/Remove items and sync with LocalStorage ---

    const addToRecents = (path: string) => {
        setRecentFiles(prev => {
            // Filter duplicates, push new to top, limit to 10 items
            const next = [path, ...prev.filter(p => p !== path)].slice(0, 10);
            localStorage.setItem('metrix_recents', JSON.stringify(next));
            return next;
        });
    };

    const removeRecentFile = (path: string) => {
        setRecentFiles(prev => {
            const next = prev.filter(p => p !== path);
            localStorage.setItem('metrix_recents', JSON.stringify(next));
            return next;
        });
    };

    // --- Database Connection Actions ---

    const connectDatabase = async (path: string) => {
        try {
            // Strictly opening an existing DB (uses open_if_exists internally)
            await DatabaseApi.connectExisting(path);
            setDbPath(path);
            addToRecents(path);
        } catch (e) {
            // AUTOMATIC CLEANUP: If path is invalid or missing, remove it from history
            removeRecentFile(path);
            console.error("[AppStore] Connection failed for path:", path);
            throw e; // Propagate error for UI feedback
        }
    };

    const createNewDatabase = async (parentDir: string, name: string) => {
        // Enforce the .mx extension logic
        const fullPath = `${parentDir}/${name}.mx`;
        try {
            await DatabaseApi.create(fullPath); // Uses 'open' internally which creates files
            setDbPath(fullPath);
            addToRecents(fullPath);
        } catch (e) {
            console.error("[AppStore] Creation failed:", e);
            throw e;
        }
    };

    const disconnectDatabase = async () => {
        await DatabaseApi.disconnect();
        setDbPath(null);
        setGraphData({ nodes: [], links: [] });
        setSelectedElement(null);
        setSelectionType(null);
    };

    // --- Query Execution Logic ---

    const runQuery = async (overrideQuery?: string) => {
        const queryToRun = overrideQuery || query;
        if (overrideQuery) setQuery(overrideQuery);

        if (!dbPath) return;
        const start = Date.now();

        try {
            const res = await DatabaseApi.query(queryToRun);

            // Transform data (Ensure deep copy for Cytoscape reactivity)
            setGraphData({
                nodes: res.nodes.map(n => ({ ...n })),
                links: res.edges.map(e => ({ ...e }))
            });

            // Update History with Deduplication
            setHistory(prev => {
                const newItem: HistoryItem = {
                    id: crypto.randomUUID(),
                    query: queryToRun,
                    timestamp: Date.now(),
                    status: 'success',
                    duration: res.duration_ms,
                    resultCount: res.nodes.length
                };
                // If the most recent query is identical, replace it to refresh the timestamp
                if (prev.length > 0 && prev[0].query === queryToRun) {
                    return [newItem, ...prev.slice(1)];
                }
                return [newItem, ...prev];
            });

        } catch (e) {
            // Log error in history
            setHistory(prev => [{
                id: crypto.randomUUID(),
                query: queryToRun,
                timestamp: Date.now(),
                status: 'error',
                duration: Date.now() - start,
                resultCount: 0
            }, ...prev]);
            throw e;
        }
    };

    // --- Layout Control Actions ---

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
            setActiveTopPanel(null); // Close if already active
        } else {
            setActiveTopPanel(panel); // Switch to new panel
        }
    };

    const toggleBottomPanel = (panel: 'analysis') => {
        if (activeBottomPanel === panel) {
            setActiveBottomPanel(null);
        } else {
            setActiveBottomPanel(panel);
        }
    };

    const setSelection = (el: GraphNode | GraphEdge | null, type: 'node' | 'edge' | null) => {
        setSelectedElement(el);
        setSelectionType(type);
        // UX: Auto-open the properties inspector when an element is clicked
        if (el && activeTopPanel !== 'properties') {
            setActiveTopPanel('properties');
        }
    };

    // --- Provider ---
    return (
        <AppContext.Provider value={{
            dbPath,
            isConnected: !!dbPath,
            recentFiles,

            // Sidebar Controls
            activeLeftTab, isLeftSidebarOpen, toggleLeftSidebar,
            activeTopPanel, activeBottomPanel, isRightSidebarOpen,
            toggleTopPanel, toggleBottomPanel,

            // Data State
            query, setQuery, runQuery,
            graphData,
            selectedElement, selectionType, setSelection,
            history,

            // Connection Actions
            connectDatabase, createNewDatabase, disconnectDatabase, removeRecentFile
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