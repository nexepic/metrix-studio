import React from 'react';
import { useApp } from '@/context/AppStore';
import { CheckCircle2, AlertCircle, Play, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

export const HistoryList: React.FC = () => {
    const { history, runQuery } = useApp(); // Destructure runQuery

    if (history.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-zinc-500 p-6 text-center select-none">
                <div className="p-3 bg-zinc-900/50 rounded-full mb-3">
                    <Clock size={24} className="opacity-40" />
                </div>
                <p className="text-xs font-medium">No execution history</p>
                <p className="text-[10px] text-zinc-600 mt-1">Queries you run will appear here.</p>
            </div>
        );
    }

    return (
        <ScrollArea className="h-full w-full">
            <div className="flex flex-col">
                {history.map((item) => (
                    <div
                        key={item.id}
                        className="group flex flex-col gap-2 p-3 border-b border-zinc-800/50 hover:bg-zinc-900/40 transition-colors"
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
                                <span className="text-[10px] text-zinc-500 font-mono">{item.duration}ms</span>
                                <button
                                    onClick={() => runQuery(item.query)} // Execute Immediately
                                    className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-indigo-500/20 hover:text-indigo-400 text-zinc-500 rounded-md transition-all active:scale-95"
                                    title="Run Query Again"
                                >
                                    <Play size={10} fill="currentColor" />
                                </button>
                            </div>
                        </div>
                        <code
                            className={cn(
                                "text-[11px] font-mono break-all line-clamp-3 leading-relaxed cursor-pointer hover:text-zinc-100 transition-colors",
                                item.status === 'error' ? "text-red-400/80" : "text-zinc-400"
                            )}
                            onClick={() => runQuery(item.query)} // Click text to run too
                            title="Click to run"
                        >
                            {item.query}
                        </code>
                    </div>
                ))}
            </div>
        </ScrollArea>
    );
};