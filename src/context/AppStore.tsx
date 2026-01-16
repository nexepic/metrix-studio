import {createContext, useContext, useState, useEffect, ReactNode} from 'react';
import {GraphNode, GraphEdge, HistoryItem} from '@/types';
import {DatabaseApi} from '@/api/database';

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
    lastError: string | null;
    clearError: () => void;
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

    activeResultView: 'graph' | 'table';
    setActiveResultView: (view: 'graph' | 'table') => void;
    queryResultMetadata: { columns: string[], rows: any[][] };
}

const AppContext = createContext<AppState | undefined>(undefined);

export const AppProvider = ({children}: { children: ReactNode }) => {
    // --- Core Data State ---
    const [dbPath, setDbPath] = useState<string | null>(null);
    const [query, setQuery] = useState("MATCH (n)-[r]->(m) RETURN n,r,m LIMIT 50");
    const [graphData, setGraphData] = useState<{ nodes: GraphNode[]; links: GraphEdge[] }>({nodes: [], links: []});
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
        setGraphData({nodes: [], links: []});
        setSelectedElement(null);
        setSelectionType(null);
    };

    // --- Query Execution Logic ---

    const [lastError, setLastError] = useState<string | null>(null);

    const clearError = () => setLastError(null);

    const updateHistory = (
        queryStr: string,
        status: 'success' | 'error',
        duration: number,
        resultCount: number
    ) => {
        setHistory(prev => {
            // 1. Create the fresh history record
            const newItem: HistoryItem = {
                id: crypto.randomUUID(),
                query: queryStr,
                timestamp: Date.now(),
                status,
                duration,
                resultCount
            };

            // 2. DEDUPLICATION: Remove the query if it exists ANYWHERE in the list.
            // This prevents duplicates when re-running older queries from history.
            const filteredHistory = prev.filter(item => item.query !== queryStr);

            // 3. Return the new item at the top, followed by the rest of the history.
            // We limit to 50 items to maintain performance and UI cleanliness.
            return [newItem, ...filteredHistory].slice(0, 50);
        });
    };

    const [activeResultView, setActiveResultView] = useState<'graph' | 'table'>('graph');
    const [queryResultMetadata, setQueryResultMetadata] = useState<{ columns: string[], rows: any[][] }>({ columns: [], rows: [] });

    const runQuery = async (overrideQuery?: string) => {
        const queryToRun = overrideQuery || query;
        if (!dbPath) return;

        // Reset error state at the start of a new execution
        setLastError(null);
        const start = Date.now();

        try {
            // 1. Execute via API
            const res = await DatabaseApi.query(queryToRun);

            setQueryResultMetadata({ columns: res.columns, rows: res.rows });

            if (res.nodes.length === 0 && res.rows.length > 0) {
                setActiveResultView('table');
            } else {
                setActiveResultView('graph');
            }

            // 2. Update Graph Visuals
            setGraphData({
                nodes: res.nodes.map(n => ({...n})),
                links: res.edges.map(e => ({...e}))
            });

            // 3. Log Success in History (with deduplication)
            updateHistory(queryToRun, 'success', res.duration_ms, res.nodes.length);

            // 4. Sync current query string with the editor if it came from an override (history click)
            if (overrideQuery) setQuery(overrideQuery);

        } catch (err: any) {
            // 1. Extract error message
            const errorMsg = typeof err === 'string' ? err : (err?.message || "Execution failed");
            const duration = Date.now() - start;

            // 2. Set UI Error state (displays the red banner)
            setLastError(errorMsg);

            // 3. Log Failure in History (Now correctly deduplicated)
            updateHistory(queryToRun, 'error', duration, 0);
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
            lastError,
            clearError,
            graphData,
            selectedElement, selectionType, setSelection,
            history,

            // Connection Actions
            connectDatabase, createNewDatabase, disconnectDatabase, removeRecentFile,

            activeResultView, setActiveResultView, queryResultMetadata
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