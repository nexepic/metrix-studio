import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { GraphNode, GraphEdge, HistoryItem } from '@/types';
import { DatabaseApi } from '@/api/database';

interface AppState {
    dbPath: string | null;
    isConnected: boolean;
    activeLeftTab: 'explorer' | 'search' | 'settings';
    isLeftSidebarOpen: boolean;
    toggleLeftSidebar: (tab: 'explorer' | 'search' | 'settings') => void;
    activeTopPanel: 'properties' | 'history' | null;
    activeBottomPanel: 'analysis' | null;
    isRightSidebarOpen: boolean;
    toggleTopPanel: (panel: 'properties' | 'history') => void;
    toggleBottomPanel: (panel: 'analysis') => void;
    query: string;
    graphData: { nodes: GraphNode[]; links: GraphEdge[] };
    selectedElement: GraphNode | GraphEdge | null;
    selectionType: 'node' | 'edge' | null;
    history: HistoryItem[];
    recentFiles: string[]; // Added Recent Files State

    connectDatabase: (path: string) => Promise<void>;
    disconnectDatabase: () => Promise<void>;
    runQuery: (overrideQuery?: string) => Promise<void>;
    setQuery: (q: string) => void;
    setSelection: (el: GraphNode | GraphEdge | null, type: 'node' | 'edge' | null) => void;
}

const AppContext = createContext<AppState | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
    // State
    const [dbPath, setDbPath] = useState<string | null>(null);
    const [query, setQuery] = useState("MATCH (n)-[r]->(m) RETURN n,r,m LIMIT 50");
    const [graphData, setGraphData] = useState<{ nodes: GraphNode[]; links: GraphEdge[] }>({ nodes: [], links: [] });
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [recentFiles, setRecentFiles] = useState<string[]>([]);
    const [selectedElement, setSelectedElement] = useState<GraphNode | GraphEdge | null>(null);
    const [selectionType, setSelectionType] = useState<'node' | 'edge' | null>(null);

    // Layout State
    const [activeLeftTab, setActiveLeftTab] = useState<'explorer' | 'search' | 'settings'>('explorer');
    const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(true);
    const [activeTopPanel, setActiveTopPanel] = useState<'properties' | 'history' | null>('properties');
    const [activeBottomPanel, setActiveBottomPanel] = useState<'analysis' | null>(null);
    const isRightSidebarOpen = activeTopPanel !== null || activeBottomPanel !== null;

    // Load Recents on Mount
    useEffect(() => {
        const saved = localStorage.getItem('metrix_recents');
        if (saved) setRecentFiles(JSON.parse(saved));
    }, []);

    const addToRecents = (path: string) => {
        setRecentFiles(prev => {
            const next = [path, ...prev.filter(p => p !== path)].slice(0, 5); // Keep top 5
            localStorage.setItem('metrix_recents', JSON.stringify(next));
            return next;
        });
    };

    // Actions
    const connectDatabase = async (path: string) => {
        try {
            await DatabaseApi.connect(path);
            setDbPath(path);
            addToRecents(path);
        } catch (e) { throw e; }
    };

    const disconnectDatabase = async () => {
        await DatabaseApi.disconnect();
        setDbPath(null);
        setGraphData({ nodes: [], links: [] });
    };

    const runQuery = async (overrideQuery?: string) => {
        // Use override if provided, otherwise use current editor state
        const queryToRun = overrideQuery || query;

        // If it's an override (from history), update the editor UI too
        if (overrideQuery) {
            setQuery(overrideQuery);
        }

        if (!dbPath) return;

        const start = Date.now();
        try {
            // Use the determined query string
            const res = await DatabaseApi.query(queryToRun);

            setGraphData({
                nodes: res.nodes.map(n => ({ ...n })),
                links: res.edges.map(e => ({ ...e }))
            });

            setHistory(prev => {
                // Check if the latest item is the same query
                const lastItem = prev[0];
                const newItem: HistoryItem = {
                    id: crypto.randomUUID(),
                    query: queryToRun,
                    timestamp: Date.now(),
                    status: 'success',
                    duration: res.duration_ms,
                    resultCount: res.nodes.length
                };

                // If same query string as last time, remove the old one and add new one to top (updates timestamp)
                // Or if you strictly don't want to add it if it exists recently:
                if (lastItem && lastItem.query === queryToRun) {
                    return [newItem, ...prev.slice(1)]; // Replace top item
                }

                return [newItem, ...prev]; // Add new item
            });
        } catch (e) {
            setHistory(prev => [{
                id: crypto.randomUUID(),
                query: queryToRun,
                timestamp: Date.now(),
                status: 'error',
                duration: Date.now() - start,
                resultCount: 0
            }, ...prev]);
        }
    };

    const setSelection = (el: GraphNode | GraphEdge | null, type: 'node' | 'edge' | null) => {
        setSelectedElement(el);
        setSelectionType(type);
        if (el) setActiveTopPanel('properties');
    };

    const toggleLeftSidebar = (tab: any) => {
        if (activeLeftTab === tab) setIsLeftSidebarOpen(!isLeftSidebarOpen);
        else { setActiveLeftTab(tab); setIsLeftSidebarOpen(true); }
    };

    const toggleTopPanel = (panel: any) => activeTopPanel === panel ? setActiveTopPanel(null) : setActiveTopPanel(panel);
    const toggleBottomPanel = (panel: any) => activeBottomPanel === panel ? setActiveBottomPanel(null) : setActiveBottomPanel(panel);

    return (
        <AppContext.Provider value={{
            dbPath, isConnected: !!dbPath, recentFiles,
            connectDatabase, disconnectDatabase, runQuery,
            activeLeftTab, isLeftSidebarOpen, toggleLeftSidebar,
            activeTopPanel, activeBottomPanel, isRightSidebarOpen, toggleTopPanel, toggleBottomPanel,
            query, setQuery, graphData, selectedElement, selectionType, setSelection, history
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