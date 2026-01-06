import { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { listen } from "@tauri-apps/api/event";
import ForceGraph2D from "react-force-graph-2d";
import {
    Play,
    Database,
    FolderOpen,
    X,
    Layers,
    Settings,
    Search,
    Cpu
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

// --- Types Definition ---

interface GraphNode {
    id: number;
    label: string;
    properties: Record<string, any>;
    val?: number; // Visual size for force graph
    color?: string;
}

interface GraphEdge {
    id: number;
    source: number | GraphNode; // ForceGraph mutates this to object ref
    target: number | GraphNode;
    label: string;
}

interface QueryResult {
    nodes: GraphNode[];
    edges: GraphEdge[];
    duration_ms: number;
}

// --- Main Component ---

function App() {
    // Application State
    const [dbPath, setDbPath] = useState<string | null>(null);
    const [cypher, setCypher] = useState("MATCH (n)-[r]->(m) RETURN n, r, m LIMIT 50");
    const [data, setData] = useState<{ nodes: GraphNode[]; links: GraphEdge[] }>({ nodes: [], links: [] });
    const [loading, setLoading] = useState(false);
    const [consoleLog, setConsoleLog] = useState<string>("Ready.");
    const [dimensions, setDimensions] = useState({ w: 800, h: 600 });

    // Ref for the graph container to auto-resize
    const graphContainerRef = useRef<HTMLDivElement>(null);

    // --- Effects ---

    // 1. Resize Observer: Adjust graph size when window resizes
    useEffect(() => {
        if (!graphContainerRef.current) return;
        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                setDimensions({ w: entry.contentRect.width, h: entry.contentRect.height });
            }
        });
        resizeObserver.observe(graphContainerRef.current);
        return () => resizeObserver.disconnect();
    }, [dbPath]);

    // 2. Drag & Drop Listener: Listen for system file drop events
    useEffect(() => {
        const unlistenPromise = listen<string[]>('tauri://file-drop', async (event) => {
            const files = event.payload;
            if (files && files.length > 0) {
                const path = files[0];
                // Optional: Check extension
                // if (path.endsWith('.mx') || path.endsWith('.db')) {
                await openDatabaseFromFile(path);
                // }
            }
        });

        // Cleanup listener on unmount
        return () => {
            unlistenPromise.then(unlisten => unlisten());
        };
    }, []);

    // --- Helper Logic ---

    // Shared logic to open DB (used by Dialog and Drag&Drop)
    const openDatabaseFromFile = async (path: string) => {
        try {
            setLoading(true);
            setConsoleLog(`[System]: Opening ${path}...`);

            // Call Rust backend
            const msg = await invoke<string>("open_database", { path });

            setDbPath(path);
            setConsoleLog(`[System]: ${msg}`);
        } catch (e: any) {
            console.error(e);
            setConsoleLog(`[Error]: ${e.toString()}`);
            alert(`Failed to open database: ${e}`);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDbDialog = async () => {
        try {
            const selected = await open({
                multiple: false,
                filters: [{ name: 'MetrixDB', extensions: ['mx', 'db', 'bin'] }]
            });

            if (selected && typeof selected === 'string') {
                await openDatabaseFromFile(selected);
            }
        } catch (e: any) {
            console.error(e);
            setConsoleLog(`[Error]: ${e.toString()}`);
        }
    };

    const handleCloseDb = async () => {
        try {
            await invoke("close_database");
            setDbPath(null);
            setData({ nodes: [], links: [] });
            setConsoleLog("Database closed.");
        } catch (e: any) {
            setConsoleLog(`[Error]: ${e.toString()}`);
        }
    };

    const handleRunQuery = async () => {
        if (!dbPath) return;
        setLoading(true);
        try {
            const res = await invoke<QueryResult>("run_query", { query: cypher });

            // 1. Deduplicate Nodes (Crucial for rendering)
            // Cypher results often contain the same node in multiple rows.
            const nodeMap = new Map<number, GraphNode>();
            res.nodes.forEach(node => {
                if (!nodeMap.has(node.id)) {
                    nodeMap.set(node.id, {
                        ...node,
                        val: 7, // Node size
                        color: stringToColor(node.label)
                    });
                }
            });

            // 2. Map Edges (Links)
            // Ensure links are unique by ID and formatted for ForceGraph
            const edgeMap = new Map<number, any>();
            res.edges.forEach(edge => {
                if (!edgeMap.has(edge.id)) {
                    edgeMap.set(edge.id, {
                        id: edge.id,
                        source: edge.source,
                        target: edge.target,
                        label: edge.label,
                        properties: edge.properties
                    });
                }
            });

            const graphData = {
                nodes: Array.from(nodeMap.values()),
                links: Array.from(edgeMap.values())
            };

            setData(graphData);
            setConsoleLog(`[Success]: Displaying ${graphData.nodes.length} nodes and ${graphData.links.length} edges.`);

            // Auto-focus the graph view
            setTimeout(() => {
                if (fgRef.current) {
                    fgRef.current.zoomToFit(400, 50);
                }
            }, 200);

        } catch (e: any) {
            console.error("Query Error:", e);
            setConsoleLog(`[Query Error]: ${e.toString()}`);
        } finally {
            setLoading(false);
        }
    };

    // Helper: Generate consistent color from string
    const stringToColor = (str: string) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        const c = (hash & 0x00ffffff).toString(16).toUpperCase();
        return '#' + '00000'.substring(0, 6 - c.length) + c;
    }

    // --- Render: Welcome Screen (No DB) ---

    if (!dbPath) {
        return (
            <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-950 text-slate-100 relative overflow-hidden">
                {/* Background Ambient Glow */}
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-900/20 rounded-full blur-[128px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-900/20 rounded-full blur-[128px]" />

                <div className="z-10 text-center space-y-8 animate-in fade-in zoom-in duration-500">
                    <div className="flex flex-col items-center gap-2">
                        <Cpu size={64} className="text-blue-500 mb-2" />
                        <h1 className="text-5xl font-bold tracking-tight bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
                            Metrix Studio
                        </h1>
                        <p className="text-slate-400 text-lg">High-Performance Graph Analysis Client</p>
                    </div>

                    <div
                        onClick={handleOpenDbDialog}
                        className="group cursor-pointer border border-slate-800 bg-slate-900/50 hover:bg-slate-800/80 hover:border-blue-500/50 transition-all duration-300 rounded-xl p-10 w-[400px] flex flex-col items-center gap-4 shadow-2xl"
                    >
                        <div className="p-4 bg-slate-950 rounded-full border border-slate-800 group-hover:scale-110 transition-transform">
                            <FolderOpen size={32} className="text-blue-400" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-xl font-semibold text-slate-200">Open Database</h3>
                            <p className="text-sm text-slate-500">Drag & Drop file or click to select</p>
                        </div>
                    </div>
                </div>

                <div className="absolute bottom-6 text-slate-600 text-xs">
                    Powered by MetrixDB Engine & Rust
                </div>
            </div>
        );
    }

    // --- Render: Main Dashboard (DB Open) ---

    return (
        <div className="h-screen w-screen flex flex-col bg-slate-950 text-slate-100 overflow-hidden">

            {/* 1. Top Header */}
            <header className="h-14 border-b border-slate-800 bg-slate-950 flex items-center justify-between px-4 shrink-0 z-20">
                <div className="flex items-center gap-3">
                    <div className="bg-blue-600/20 p-1.5 rounded-md">
                        <Database size={18} className="text-blue-400" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-semibold text-slate-200 leading-none">Metrix Studio</span>
                        <span className="text-[10px] text-slate-500 font-mono leading-none mt-1 truncate max-w-[300px]" title={dbPath}>
                            {dbPath}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                        <Settings size={18} />
                    </Button>
                    <div className="h-4 w-[1px] bg-slate-800 mx-1"></div>
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleCloseDb}
                        className="h-8 px-3 text-xs bg-red-900/20 hover:bg-red-900/40 text-red-400 border border-red-900/50"
                    >
                        <X size={14} className="mr-1.5" /> Close
                    </Button>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">

                {/* 2. Left Sidebar (Navigation) */}
                <aside className="w-14 border-r border-slate-800 bg-slate-950 flex flex-col items-center py-4 gap-4 shrink-0 z-10">
                    <Button variant="ghost" size="icon" className="text-blue-400 bg-blue-400/10 hover:bg-blue-400/20">
                        <Search size={20} />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-slate-500 hover:text-slate-300">
                        <Layers size={20} />
                    </Button>
                </aside>

                {/* 3. Main Workspace */}
                <main className="flex-1 flex flex-col relative min-w-0">

                    {/* A. Query Editor Section */}
                    <div className="h-[35%] min-h-[150px] flex flex-col border-b border-slate-800 bg-slate-900/50">
                        <div className="h-9 px-4 flex items-center justify-between bg-slate-950 border-b border-slate-800/50">
                            <span className="text-xs font-bold text-slate-500 tracking-wider flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-green-500"></span> CYPHER EDITOR
                            </span>
                            <Button
                                size="sm"
                                onClick={handleRunQuery}
                                disabled={loading}
                                className="h-6 text-xs bg-blue-600 hover:bg-blue-500 text-white border-0"
                            >
                                {loading ? (
                                    <span className="animate-spin mr-2">⟳</span>
                                ) : (
                                    <Play size={12} className="mr-1.5 fill-current" />
                                )}
                                Run Query
                            </Button>
                        </div>
                        <div className="flex-1 relative group">
                            <Textarea
                                value={cypher}
                                onChange={e => setCypher(e.target.value)}
                                className="w-full h-full p-4 font-mono text-sm bg-slate-900/50 text-slate-300 border-0 focus-visible:ring-0 resize-none rounded-none leading-relaxed"
                                placeholder="Enter Cypher query..."
                                spellCheck={false}
                            />
                        </div>
                        {/* Status Bar */}
                        <div className="h-7 px-4 flex items-center bg-slate-950 border-t border-slate-800 text-[11px] font-mono text-slate-400 truncate">
                            {consoleLog}
                        </div>
                    </div>

                    {/* B. Visualization Section */}
                    <div className="flex-1 bg-slate-950 relative overflow-hidden" ref={graphContainerRef}>
                        {data.nodes.length > 0 ? (
                            <ForceGraph2D
                                width={dimensions.w}
                                height={dimensions.h}
                                graphData={data}
                                nodeLabel="label"
                                nodeColor="color"
                                nodeRelSize={6}
                                linkColor={() => "#334155"} // Slate-700
                                linkDirectionalArrowLength={3.5}
                                linkDirectionalArrowRelPos={1}
                                backgroundColor="#020617" // Slate-950
                                onNodeClick={(node) => {
                                    setConsoleLog(`[Node Selected]: ID=${node.id}, Label=${node.label}, Props=${JSON.stringify(node.properties)}`);
                                }}
                            />
                        ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600 gap-4">
                                <div className="w-16 h-16 rounded-full border-2 border-dashed border-slate-700 flex items-center justify-center">
                                    <Search size={24} />
                                </div>
                                <p className="text-sm">Execute a query to visualize the graph</p>
                            </div>
                        )}

                        {/* Floating Info Overlay */}
                        {data.nodes.length > 0 && (
                            <div className="absolute bottom-4 right-4 bg-slate-900/80 backdrop-blur border border-slate-800 p-3 rounded-lg text-xs text-slate-400 shadow-xl pointer-events-none">
                                <div>Nodes: <span className="text-slate-200 font-mono">{data.nodes.length}</span></div>
                                <div>Edges: <span className="text-slate-200 font-mono">{data.links.length}</span></div>
                            </div>
                        )}
                    </div>

                </main>
            </div>
        </div>
    );
}

export default App;