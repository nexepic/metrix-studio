import React, { useEffect, useRef, useState } from 'react';
import cytoscape, { Core, ElementDefinition } from 'cytoscape';
// @ts-ignore
import cola from 'cytoscape-cola';
import { useApp } from '@/context/AppStore';
import { graphStyles, defaultLayout, generateNodeColor } from './graphConfig';
import { MousePointerClick, ZoomIn, ZoomOut, Maximize, Layers, Search as SearchIcon } from 'lucide-react';
import { graphEvents } from '@/lib/events'; // Import Event Bus

// Register Layout Extension
cytoscape.use(cola);

export const GraphCanvas: React.FC = () => {
    const { graphData, setSelection } = useApp();
    const containerRef = useRef<HTMLDivElement>(null);
    const cyRef = useRef<Core | null>(null);

    // UI State
    const [stats, setStats] = useState({ nodes: 0, edges: 0 });
    const [searchTerm, setSearchTerm] = useState("");
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    // --- 1. Initialize Cytoscape Instance ---
    useEffect(() => {
        if (!containerRef.current) return;

        const cy = cytoscape({
            container: containerRef.current,
            style: graphStyles,
            maxZoom: 4,
            minZoom: 0.2,
            selectionType: 'single',
            // Removed wheelSensitivity to suppress warning
        });

        cyRef.current = cy;

        // --- Event Binding ---
        cy.on('tap', 'node', (evt) => {
            const node = evt.target;
            setSelection({
                id: Number(node.id()),
                label: node.data('label'),
                properties: node.data('properties')
            }, 'node');
        });

        cy.on('tap', 'edge', (evt) => {
            const edge = evt.target;
            const rawId = edge.id().replace('e', '');
            setSelection({
                id: Number(rawId),
                label: edge.data('label') || 'EDGE',
                properties: edge.data('properties')
            }, 'edge');
        });

        cy.on('tap', (evt) => {
            if (evt.target === cy) {
                setSelection(null, null);
            }
        });

        // --- ALGORITHM EXECUTION HANDLER ---
        const handleAlgoEvent = (detail: any) => {
            if (cy.destroyed()) return;

            console.log("[GraphCanvas] Running:", detail.algorithm);

            // 1. PageRank Logic
            if (detail.algorithm === 'pagerank') {
                const pr = cy.elements().pageRank({
                    dampingFactor: 0.85,
                    iterations: 50
                });

                cy.batch(() => {
                    cy.nodes().forEach(node => {
                        const rank = pr.rank(node); // 0 to 1
                        const newSize = 20 + (rank * 100);
                        // Animate node size based on rank
                        node.animate({
                            style: { 'width': newSize, 'height': newSize },
                            duration: 500
                        });
                    });
                });
            }

            // 2. Clustering (Degree Centrality as Proxy)
            if (detail.algorithm === 'louvain') {
                // FIX: Added 'weight' to satisfy TypeScript requirement
                const dc = cy.elements().degreeCentralityNormalized({
                    directed: false,
                    weight: () => 1 // Treat all edges equally
                });

                const centralityResult = dc as any;

                cy.batch(() => {
                    cy.nodes().forEach(node => {
                        // Get normalized degree (0 to 1)
                        const degree = centralityResult.degree(node);

                        // Highlight Hubs (Top 30% importance approx)
                        if (degree > 0.3) {
                            node.animate({
                                style: {
                                    'background-color': '#ec4899', // Pink Highlight
                                    'border-width': 2,
                                    'border-color': '#fff',
                                    'width': 28,
                                    'height': 28
                                },
                                duration: 500
                            });
                        } else {
                            // Dim non-hub nodes
                            node.animate({
                                style: {
                                    'opacity': 0.3,
                                    'border-width': 1,
                                    'width': 16,
                                    'height': 16
                                },
                                duration: 500
                            });
                        }
                    });
                });
            }
        };

        // Listen for events from Sidebar
        graphEvents.on('run-algorithm', handleAlgoEvent);

        return () => {
            graphEvents.off('run-algorithm', handleAlgoEvent);
            cy.destroy();
        };
    }, []);

    // --- 2. Update Graph Data ---
    useEffect(() => {
        if (!cyRef.current) return;
        const cy = cyRef.current;
        if (cy.destroyed()) return;

        const elements: ElementDefinition[] = [
            ...graphData.nodes.map(n => ({
                group: 'nodes' as const,
                data: {
                    id: n.id.toString(),
                    label: n.label,
                    properties: n.properties,
                    color: generateNodeColor(n.label)
                }
            })),
            ...graphData.links.map(e => ({
                group: 'edges' as const,
                data: {
                    id: `e${e.id}`,
                    source: e.source.toString(),
                    target: e.target.toString(),
                    label: e.label,
                    properties: e.properties
                }
            }))
        ];

        cy.batch(() => {
            cy.elements().remove();
            cy.add(elements);
        });

        if (elements.length > 0) {
            cy.layout(defaultLayout).run();
        }

        setStats({ nodes: graphData.nodes.length, edges: graphData.links.length });

    }, [graphData]);

    // --- Actions ---
    const handleZoomIn = () => cyRef.current?.zoom(cyRef.current.zoom() + 0.2);
    const handleZoomOut = () => cyRef.current?.zoom(cyRef.current.zoom() - 0.2);
    const handleFit = () => cyRef.current?.fit(undefined, 50);
    const handleLayout = () => cyRef.current?.layout(defaultLayout).run();

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (!cyRef.current || !searchTerm.trim()) return;

        cyRef.current.elements().removeClass('highlight');
        const targets = cyRef.current.nodes().filter(n => {
            const label = n.data('label')?.toLowerCase() || "";
            const id = n.id();
            const term = searchTerm.toLowerCase();
            return label.includes(term) || id === term;
        });

        if (targets.length > 0) {
            targets.addClass('highlight');
            cyRef.current.fit(targets, 100);
            const first = targets.first();
            setSelection({
                id: Number(first.id()),
                label: first.data('label'),
                properties: first.data('properties')
            }, 'node');
        }
    };

    return (
        <div className="w-full h-full relative bg-[#050505] overflow-hidden group select-none">
            <div ref={containerRef} className="w-full h-full" />

            {/* Empty State */}
            {stats.nodes === 0 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <div className="p-4 rounded-full bg-zinc-900/50 border border-zinc-800/50 mb-4">
                        <MousePointerClick size={32} strokeWidth={1.5} className="text-indigo-500/80" />
                    </div>
                    <p className="text-sm font-medium text-zinc-300">No Data to Visualize</p>
                    <p className="text-xs text-zinc-500 mt-2 max-w-[200px] text-center">
                        Run a Cypher query above to populate the graph view.
                    </p>
                </div>
            )}

            {/* Toolbar */}
            <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                <GraphBtn onClick={handleZoomIn} icon={<ZoomIn size={16} />} title="Zoom In" />
                <GraphBtn onClick={handleZoomOut} icon={<ZoomOut size={16} />} title="Zoom Out" />
                <div className="h-[1px] bg-zinc-800 my-1" />
                <GraphBtn onClick={handleFit} icon={<Maximize size={16} />} title="Fit to Screen" />
                <GraphBtn onClick={handleLayout} icon={<Layers size={16} />} title="Re-run Layout" />
                <div className="h-[1px] bg-zinc-800 my-1" />
                <GraphBtn
                    onClick={() => setIsSearchOpen(!isSearchOpen)}
                    icon={<SearchIcon size={16} />}
                    title="Search Nodes"
                    active={isSearchOpen}
                />
            </div>

            {/* Search */}
            {isSearchOpen && (
                <div className="absolute top-4 right-16 z-20 animate-in slide-in-from-right-4 fade-in duration-200">
                    <form onSubmit={handleSearch} className="flex items-center gap-2 bg-zinc-900/90 backdrop-blur border border-zinc-700 p-1.5 rounded-lg shadow-xl">
                        <input
                            autoFocus
                            type="text"
                            placeholder="Find ID or Label..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="bg-transparent border-none outline-none text-xs text-zinc-200 placeholder:text-zinc-600 w-32 px-2"
                        />
                        <button type="submit" className="p-1 bg-indigo-600 hover:bg-indigo-500 rounded text-white transition-colors">
                            <SearchIcon size={12} />
                        </button>
                    </form>
                </div>
            )}

            {/* Stats */}
            {stats.nodes > 0 && (
                <div className="absolute bottom-4 right-4 pointer-events-none animate-in slide-in-from-bottom-2 fade-in">
                    <div className="bg-zinc-950/80 backdrop-blur-md border border-zinc-800/80 rounded-lg px-3 py-1.5 text-[10px] shadow-xl flex items-center gap-3">
                        <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-indigo-500" />
                            <span className="text-zinc-400">Nodes:</span>
                            <span className="text-zinc-100 font-mono font-semibold">{stats.nodes}</span>
                        </div>
                        <div className="h-3 w-[1px] bg-zinc-800" />
                        <div className="flex items-center gap-1.5">
                            <span className="text-zinc-400">Edges:</span>
                            <span className="text-zinc-100 font-mono font-semibold">{stats.edges}</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Helper Button
const GraphBtn: React.FC<any> = ({ onClick, icon, title, active }) => (
    <button
        onClick={onClick}
        title={title}
        className={`
            p-2 text-zinc-400 border rounded-md backdrop-blur-sm transition-all shadow-lg active:scale-95
            ${active
            ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300'
            : 'bg-zinc-900/80 border-zinc-800 hover:bg-zinc-800 hover:text-indigo-400'}
        `}
    >
        {icon}
    </button>
);