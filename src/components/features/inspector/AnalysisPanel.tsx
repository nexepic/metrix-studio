import React, {useState} from 'react';
import {useApp} from '@/context/AppStore';
import {Play, Network, Share2, RefreshCw} from "lucide-react";
import {ScrollArea} from "@/components/ui/scroll-area";
import {Badge} from "@/components/ui/badge";
import {graphEvents} from '@/lib/events';

export const AnalysisPanel: React.FC = () => {
    const {graphData} = useApp();
    const [isRunning, setIsRunning] = useState<string | null>(null);

    const handleRun = (algo: string) => {
        if (isRunning) return;
        setIsRunning(algo);
        graphEvents.emit('run-algorithm', {algorithm: algo});
        setTimeout(() => setIsRunning(null), 1000);
    };

    return (
        <div className="flex flex-col h-full w-full bg-zinc-950/50">
            {/* Header */}
            <div className="p-4 border-b border-zinc-800 bg-zinc-900/20 flex-shrink-0">
                <h2 className="text-sm font-bold text-zinc-100 uppercase tracking-wide flex items-center gap-2">
                    <BrainCircuitIcon/> Graph Intelligence
                </h2>
                <p className="text-[10px] text-zinc-500 mt-1">
                    Apply algorithms to the current subgraph.
                </p>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 min-h-0">
                <ScrollArea className="h-full">
                    <div className="p-4 space-y-6">
                        {/* PageRank Card */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-zinc-300">Centrality</span>
                                <Badge variant="outline"
                                       className="text-[9px] border-zinc-700 text-zinc-500">Rank</Badge>
                            </div>
                            <div
                                className="bg-zinc-900/40 border border-zinc-800 rounded-lg p-3 space-y-3 hover:border-zinc-700 transition-colors">
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-indigo-500/10 rounded-md text-indigo-400">
                                        <Network size={16}/>
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-medium text-zinc-200">PageRank</h4>
                                        <p className="text-[10px] text-zinc-500 leading-tight mt-1">
                                            Measures the importance of nodes based on incoming links.
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleRun('pagerank')}
                                    disabled={graphData.nodes.length === 0}
                                    className="w-full flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 hover:text-white text-zinc-300 py-1.5 rounded-md text-xs font-medium transition-all disabled:opacity-50 disabled:hover:bg-zinc-800"
                                >
                                    {isRunning === 'pagerank' ? <RefreshCw size={12} className="animate-spin"/> :
                                        <Play size={12} fill="currentColor"/>}
                                    Calculate PageRank
                                </button>
                            </div>
                        </div>

                        {/* Community Detection Card */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-zinc-300">Community Detection</span>
                                <Badge variant="outline"
                                       className="text-[9px] border-zinc-700 text-zinc-500">Clustering</Badge>
                            </div>
                            <div
                                className="bg-zinc-900/40 border border-zinc-800 rounded-lg p-3 space-y-3 hover:border-zinc-700 transition-colors">
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-emerald-500/10 rounded-md text-emerald-400">
                                        <Share2 size={16}/>
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-medium text-zinc-200">Degree Centrality</h4>
                                        <p className="text-[10px] text-zinc-500 leading-tight mt-1">
                                            Highlights hubs (nodes with many connections) to simulate clustering.
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleRun('louvain')}
                                    disabled={graphData.nodes.length === 0}
                                    className="w-full flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 hover:text-white text-zinc-300 py-1.5 rounded-md text-xs font-medium transition-all disabled:opacity-50 disabled:hover:bg-zinc-800"
                                >
                                    {isRunning === 'louvain' ? <RefreshCw size={12} className="animate-spin"/> :
                                        <Play size={12} fill="currentColor"/>}
                                    Detect Hubs
                                </button>
                            </div>
                        </div>
                    </div>
                </ScrollArea>
            </div>
        </div>
    );
};

const BrainCircuitIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
         strokeLinecap="round" strokeLinejoin="round" className="text-indigo-500">
        <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/>
        <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/>
        <path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4"/>
        <path d="M17.599 6.5a3 3 0 0 0 .399-1.375"/>
        <path d="M6.003 5.125A3 3 0 0 0 6.401 6.5"/>
        <path d="M3.477 10.896a4 4 0 0 1 .585-.396"/>
        <path d="M19.938 10.5a4 4 0 0 1 .585.396"/>
        <path d="M6 18a4 4 0 0 1-1.97-1.375"/>
        <path d="M19.97 16.625A4.002 4.002 0 0 1 18 18"/>
    </svg>
);