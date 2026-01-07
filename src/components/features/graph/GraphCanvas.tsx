import React, { useEffect, useRef, useMemo, useState } from 'react';
import ForceGraph2D, { ForceGraphMethods } from 'react-force-graph-2d';
import { useApp } from '@/context/AppStore';
import { MousePointerClick } from 'lucide-react';

export const GraphCanvas: React.FC = () => {
    const { graphData, setSelection } = useApp();
    const fgRef = useRef<ForceGraphMethods | undefined>(undefined);
    const containerRef = useRef<HTMLDivElement>(null);

    // Manage dimensions manually to ensure canvas fills the resizable panel
    const [dimensions, setDimensions] = useState({ w: 0, h: 0 });

    useEffect(() => {
        if (!containerRef.current) return;
        const ro = new ResizeObserver((entries) => {
            const { width, height } = entries[0].contentRect;
            setDimensions({ w: width, h: height });
        });
        ro.observe(containerRef.current);
        return () => ro.disconnect();
    }, []);

    // Memoize data to prevent graph re-simulation on every render
    const data = useMemo(() => {
        // Deep copy is crucial because ForceGraph mutates objects
        return {
            nodes: graphData.nodes.map(n => ({ ...n })),
            links: graphData.links.map(l => ({ ...l }))
        };
    }, [graphData]);

    return (
        <div ref={containerRef} className="w-full h-full bg-[#050505] relative overflow-hidden">
            {data.nodes.length === 0 ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-700 select-none">
                    <MousePointerClick size={48} strokeWidth={1} className="mb-4 opacity-50" />
                    <p className="text-sm font-medium">No Data to Visualize</p>
                    <p className="text-xs opacity-60 mt-2">Run a query to populate the graph</p>
                </div>
            ) : (
                <ForceGraph2D
                    ref={fgRef}
                    width={dimensions.w}
                    height={dimensions.h}
                    graphData={data}
                    backgroundColor="#050505"

                    // Node Styles
                    nodeLabel="label"
                    nodeColor={() => "#6366f1"} // Indigo 500
                    nodeRelSize={6}

                    // Link Styles
                    linkColor={() => "#27272a"} // Zinc 800
                    linkDirectionalArrowLength={3.5}
                    linkDirectionalArrowRelPos={1}

                    // Interaction
                    onNodeClick={(node) => {
                        // @ts-ignore - node is mutated by library
                        setSelection(node, 'node');
                        fgRef.current?.centerAt(node.x, node.y, 1000);
                        fgRef.current?.zoom(4, 2000);
                    }}
                    onLinkClick={(link) => {
                        // @ts-ignore
                        setSelection(link, 'edge');
                    }}
                    onBackgroundClick={() => setSelection(null, null)}
                />
            )}

            {/* Overlay Info */}
            <div className="absolute bottom-4 right-4 pointer-events-none">
                <div className="bg-black/80 backdrop-blur-sm border border-zinc-800 rounded-md px-3 py-1.5 text-[10px] text-zinc-500 tabular-nums">
                    Nodes: <span className="text-zinc-300">{data.nodes.length}</span> ·
                    Edges: <span className="text-zinc-300 ml-1">{data.links.length}</span>
                </div>
            </div>
        </div>
    );
};