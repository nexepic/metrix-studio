import React from 'react';
import { useApp } from '@/context/AppStore';
import { CheckCircle2, AlertCircle, Play, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area"; // Assume generic UI component

export const HistoryList: React.FC = () => {
    const { history, setQuery } = useApp();

    if (history.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-zinc-600 p-6 text-center">
                <Clock size={32} className="mb-3 opacity-20" />
                <p className="text-xs">Execution history is empty.</p>
            </div>
        );
    }

    return (
        <ScrollArea className="h-full">
            <div className="flex flex-col">
                {history.map((item) => (
                    <div
                        key={item.id}
                        className="group flex flex-col gap-2 p-3 border-b border-zinc-800/50 hover:bg-zinc-900/50 transition-colors"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                {item.status === 'success' ? (
                                    <CheckCircle2 size={12} className="text-emerald-500" />
                                ) : (
                                    <AlertCircle size={12} className="text-red-500" />
                                )}
                                <span className="text-[10px] font-mono text-zinc-500">
                                    {new Date(item.timestamp).toLocaleTimeString()}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] text-zinc-600 font-mono">{item.duration}ms</span>
                                <button
                                    onClick={() => setQuery(item.query)}
                                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-indigo-500/10 hover:text-indigo-400 rounded transition-all"
                                    title="Load Query"
                                >
                                    <Play size={10} />
                                </button>
                            </div>
                        </div>
                        <code className={cn(
                            "text-[11px] font-mono break-all line-clamp-3 leading-relaxed",
                            item.status === 'error' ? "text-red-400/80" : "text-zinc-300/90"
                        )}>
                            {item.query}
                        </code>
                    </div>
                ))}
            </div>
        </ScrollArea>
    );
};