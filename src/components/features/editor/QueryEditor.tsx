import React from 'react';
import {useApp} from '@/context/AppStore';
import {Play, Eraser} from 'lucide-react';
import {ErrorBanner} from './ErrorBanner'; // Import the new banner

export const QueryEditor: React.FC = () => {
    const {query, setQuery, runQuery, isConnected} = useApp();

    return (
        <div className="flex flex-col h-full bg-zinc-950 relative overflow-hidden group">

            {/* 1. Toolbar */}
            <div
                className="flex items-center justify-between px-4 py-2 border-b border-zinc-800 bg-zinc-900/20 shrink-0">
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"/>
                    <span className="text-[10px] font-black uppercase tracking-[2px] text-zinc-500">
                        Cypher Editor
                    </span>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => setQuery('')}
                        className="p-1.5 text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800 rounded transition-colors"
                        title="Clear Editor"
                    >
                        <Eraser size={14}/>
                    </button>
                    <button
                        onClick={() => runQuery()}
                        disabled={!isConnected}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:grayscale text-white px-3 py-1 rounded-md text-xs font-bold transition-all shadow-lg active:scale-95"
                    >
                        <Play size={12} fill="currentColor"/> Run Query
                    </button>
                </div>
            </div>

            {/* 2. Main Editor Area */}
            <div className="flex-1 relative min-h-0">
                <textarea
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => {
                        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                            e.preventDefault();
                            runQuery();
                        }
                    }}
                    className="w-full h-full bg-transparent p-4 font-mono text-[13px] text-zinc-300 resize-none focus:outline-none placeholder:text-zinc-800 leading-relaxed selection:bg-indigo-500/30"
                    placeholder="// Type your query here..."
                    spellCheck={false}
                />

                {/*
                    ZEN MODE ERROR BANNER:
                    Appears absolutely at the bottom of the editor area.
                */}
                <ErrorBanner/>

                {/* Connection Guard Overlay */}
                {!isConnected && (
                    <div
                        className="absolute inset-0 bg-zinc-950/60 backdrop-blur-[2px] flex items-center justify-center pointer-events-none z-30">
                        <div className="bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-full shadow-2xl">
                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                                Connect to database to unlock editor
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};