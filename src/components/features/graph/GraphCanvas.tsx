import React, {useEffect, useRef, useState} from 'react';
import cytoscape, {Core, ElementDefinition} from 'cytoscape';
// @ts-ignore
import cola from 'cytoscape-cola';
import {useApp} from '@/context/AppStore';
import {graphStyles, defaultLayout, generateNodeColor} from './graphConfig';
import {
    MousePointerClick, ZoomIn, ZoomOut, Maximize,
    Layers, Search as SearchIcon, Expand, Minimize2
} from 'lucide-react';
import {graphEvents} from '@/lib/events';

// Register Layout Extension
cytoscape.use(cola);

export const GraphCanvas: React.FC = () => {
    const {graphData, setSelection} = useApp();
    const containerRef = useRef<HTMLDivElement>(null);
    const cyRef = useRef<Core | null>(null);

    // --- UI State ---
    const [stats, setStats] = useState({nodes: 0, edges: 0});
    const [searchTerm, setSearchTerm] = useState("");
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    // --- Animation & Visibility State ---
    const [isFullscreen, setIsFullscreen] = useState(false);

    // isGraphVisible controls the visual Opacity (Fade in/out)
    const [isGraphVisible, setIsGraphVisible] = useState(true);
    // isGraphRendering controls CSS Visibility (display/paint)
    // We separate this to ensure the element is REMOVED from the render tree during resize
    const [isGraphRendering, setIsGraphRendering] = useState(true);

    // --- 1. Initialize Cytoscape Instance ---
    useEffect(() => {
        if (!containerRef.current) return;

        const cy = cytoscape({
            container: containerRef.current,
            style: graphStyles,
            // Interaction settings
            maxZoom: 4,
            minZoom: 0.2,
            selectionType: 'single',
            // Allow panning during init, we handle specific centering logic later
            userPanningEnabled: true,
        });

        cyRef.current = cy;

        // --- Event Binding ---

        // Handle Node Click
        cy.on('tap', 'node', (evt) => {
            const node = evt.target;
            setSelection({
                id: Number(node.id()),
                label: node.data('label'),
                properties: node.data('properties')
            }, 'node');
        });

        // Handle Edge Click
        cy.on('tap', 'edge', (evt) => {
            const edge = evt.target;
            const rawId = edge.id().replace('e', '');
            setSelection({
                id: Number(rawId),
                label: edge.data('label') || 'EDGE',
                properties: edge.data('properties')
            }, 'edge');
        });

        // Handle Background Click (Deselect)
        cy.on('tap', (evt) => {
            if (evt.target === cy) {
                setSelection(null, null);
            }
        });

        // --- Algorithm Execution Handler ---
        const handleAlgoEvent = (detail: any) => {
            if (cy.destroyed()) return;

            console.log("[GraphCanvas] Running Algo:", detail.algorithm);

            if (detail.algorithm === 'pagerank') {
                const pr = cy.elements().pageRank({dampingFactor: 0.85, iterations: 50});
                cy.batch(() => {
                    cy.nodes().forEach(node => {
                        const rank = pr.rank(node);
                        const newSize = 20 + (rank * 100);
                        node.animate({
                            style: {'width': newSize, 'height': newSize},
                            duration: 500
                        });
                    });
                });
            }

            if (detail.algorithm === 'louvain') {
                const dc = cy.elements().degreeCentralityNormalized({directed: false, weight: () => 1});
                const centralityResult = dc as any;
                cy.batch(() => {
                    cy.nodes().forEach(node => {
                        const degree = centralityResult.degree(node);
                        if (degree > 0.3) {
                            node.animate({
                                style: {
                                    'background-color': '#ec4899',
                                    'border-width': 2,
                                    'border-color': '#fff',
                                    'width': 28,
                                    'height': 28
                                },
                                duration: 500
                            });
                        } else {
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
            try {
                cy.layout(defaultLayout).run();
            } catch (e) {
                console.warn("Layout failed", e);
            }
        }

        setStats({nodes: graphData.nodes.length, edges: graphData.links.length});

    }, [graphData]);

    // --- 3. The "Shutter" Transition Logic (Anti-Flicker) ---
    const toggleFullscreen = () => {
        const cy = cyRef.current;
        if (!cy) return;

        // Phase 1: Fade Out (Visual)
        // We start the opacity transition.
        setIsGraphVisible(false);

        // Phase 2: Remove from Render Tree (Hard Stop)
        // Wait 200ms for the fade-out to act, then force visibility: hidden.
        setTimeout(() => {
            setIsGraphRendering(false); // CSS: visibility: hidden

            // Phase 3: Resize Container (Layout)
            requestAnimationFrame(() => {
                setIsFullscreen(prev => !prev);
            });
        }, 250);

        // Phase 4: Re-emerge (Reset & Fade In)
        // Wait for the CSS transition of the container (approx 500ms) to finish.
        setTimeout(() => {
            // A. Resize internal canvas bitmap (invisible to user)
            cy.resize();

            // B. Center the graph
            cy.fit(undefined, 50);

            // C. Enable Rendering first (visibility: visible)
            setIsGraphRendering(true);

            // D. Fade In (Opacity 0 -> 1)
            requestAnimationFrame(() => {
                setIsGraphVisible(true);
            });

        }, 800); // 250ms (Phase 2) + 500ms (Transition) + 50ms buffer
    };

    // --- 4. Actions ---

    // FIX: Zoom towards the center of the viewport instead of the top-left origin.
    const handleZoomIn = () => {
        const cy = cyRef.current;
        if (!cy) return;

        // Calculate the center of the viewport (rendered pixels)
        const w = cy.width();
        const h = cy.height();
        const zoom = cy.zoom();

        // Apply zoom relative to the center rendered position
        cy.zoom({
            level: zoom + 0.2,
            renderedPosition: {x: w / 2, y: h / 2}
        });
    };

    // FIX: Zoom out from the center of the viewport.
    const handleZoomOut = () => {
        const cy = cyRef.current;
        if (!cy) return;

        const w = cy.width();
        const h = cy.height();
        const zoom = cy.zoom();

        cy.zoom({
            level: zoom - 0.2,
            renderedPosition: {x: w / 2, y: h / 2}
        });
    };

    const handleFit = () => cyRef.current?.animate({
        fit: {eles: cyRef.current.elements(), padding: 50},
        duration: 500
    } as any);
    const handleLayout = () => cyRef.current?.layout(defaultLayout).run();

    // --- 5. Search Logic ---
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
        <div
            className={`
                bg-[#050505] overflow-hidden group select-none 
                transition-all duration-500 ease-in-out
                flex items-center justify-center
                ${isFullscreen
                ? 'fixed inset-0 z-[100] w-screen h-screen'
                : 'relative w-full h-full'
            }
            `}
        >
            {/*
                Inner Container handling Visibility & Scale effects.
            */}
            <div
                ref={containerRef}
                className={`
                    w-full h-full 
                    transition-all duration-300 ease-out
                    ${isGraphVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}
                    ${isGraphRendering ? 'visible' : 'invisible'}
                `}
            />

            {/* Empty State Overlay */}
            {stats.nodes === 0 && isGraphVisible && (
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <div className="p-4 rounded-full bg-zinc-900/50 border border-zinc-800/50 mb-4">
                        <MousePointerClick size={32} strokeWidth={1.5} className="text-indigo-500/80"/>
                    </div>
                    <p className="text-sm font-medium text-zinc-300">No Data to Visualize</p>
                    <p className="text-xs text-zinc-500 mt-2 max-w-[200px] text-center">
                        Run a Cypher query above to populate the graph view.
                    </p>
                </div>
            )}

            {/* Toolbar Controls */}
            <div
                className={`
                    absolute top-4 right-4 flex flex-col gap-2 z-20 transition-all duration-300
                    ${isGraphVisible ? 'opacity-0 group-hover:opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}
                `}
            >
                <GraphBtn
                    onClick={toggleFullscreen}
                    icon={isFullscreen ? <Minimize2 size={16}/> : <Expand size={16}/>}
                    title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                    active={isFullscreen}
                />
                <div className="h-[1px] bg-zinc-800 my-1"/>
                <GraphBtn onClick={handleZoomIn} icon={<ZoomIn size={16}/>} title="Zoom In"/>
                <GraphBtn onClick={handleZoomOut} icon={<ZoomOut size={16}/>} title="Zoom Out"/>
                <div className="h-[1px] bg-zinc-800 my-1"/>
                <GraphBtn onClick={handleFit} icon={<Maximize size={16}/>} title="Fit to Screen"/>
                <GraphBtn onClick={handleLayout} icon={<Layers size={16}/>} title="Re-run Layout"/>
                <div className="h-[1px] bg-zinc-800 my-1"/>
                <GraphBtn
                    onClick={() => setIsSearchOpen(!isSearchOpen)}
                    icon={<SearchIcon size={16}/>}
                    title="Search Nodes"
                    active={isSearchOpen}
                />
            </div>

            {/* Search Bar Popup */}
            {isSearchOpen && isGraphVisible && (
                <div className="absolute top-4 right-16 z-20 animate-in slide-in-from-right-4 fade-in duration-200">
                    <form onSubmit={handleSearch}
                          className="flex items-center gap-2 bg-zinc-900/90 backdrop-blur border border-zinc-700 p-1.5 rounded-lg shadow-xl">
                        <input
                            autoFocus
                            type="text"
                            placeholder="Find ID or Label..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="bg-transparent border-none outline-none text-xs text-zinc-200 placeholder:text-zinc-600 w-32 px-2"
                        />
                        <button type="submit"
                                className="p-1 bg-indigo-600 hover:bg-indigo-500 rounded text-white transition-colors">
                            <SearchIcon size={12}/>
                        </button>
                    </form>
                </div>
            )}

            {/* Stats Overlay */}
            {stats.nodes > 0 && isGraphVisible && (
                <div
                    className="absolute bottom-4 right-4 pointer-events-none animate-in slide-in-from-bottom-2 fade-in z-20">
                    <div
                        className="bg-zinc-950/80 backdrop-blur-md border border-zinc-800/80 rounded-lg px-3 py-1.5 text-[10px] shadow-xl flex items-center gap-3">
                        <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-indigo-500"/>
                            <span className="text-zinc-400">Nodes:</span>
                            <span className="text-zinc-100 font-mono font-semibold">{stats.nodes}</span>
                        </div>
                        <div className="h-3 w-[1px] bg-zinc-800"/>
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

// --- Helper Button Component ---
interface GraphBtnProps {
    onClick: () => void;
    icon: React.ReactNode;
    title: string;
    active?: boolean;
}

const GraphBtn: React.FC<GraphBtnProps> = ({onClick, icon, title, active}) => (
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