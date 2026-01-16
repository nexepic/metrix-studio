import React from 'react';
import {AlertCircle, X, Terminal} from 'lucide-react';
import {useApp} from '@/context/AppStore';

export const ErrorBanner: React.FC = () => {
    const {lastError, clearError} = useApp();

    if (!lastError) return null;

    return (
        <div className="absolute bottom-0 left-0 right-0 z-20 animate-in slide-in-from-bottom-2 duration-300">
            {/*
                Deep red background with high blur to separate from the editor.
                Border-t uses a vibrant red for a "warning" perimeter.
            */}
            <div
                className="bg-red-950/90 backdrop-blur-md border-t border-red-500/30 shadow-2xl flex flex-col max-h-[120px]">

                {/* Header of the Error Bar */}
                <div className="flex items-center justify-between px-4 py-1.5 bg-red-500/10 border-b border-red-500/10">
                    <div className="flex items-center gap-2">
                        <AlertCircle className="text-red-400" size={14}/>
                        <span className="text-[10px] font-black uppercase tracking-widest text-red-400">
                            Query Execution Error
                        </span>
                    </div>
                    <button
                        onClick={clearError}
                        className="p-1 hover:bg-white/10 rounded-md text-red-400/60 hover:text-red-200 transition-all"
                    >
                        <X size={14}/>
                    </button>
                </div>

                {/* The Error Message Content */}
                <div className="p-4 overflow-y-auto custom-scrollbar">
                    <div className="flex gap-3">
                        <Terminal size={14} className="text-red-500/50 mt-0.5 shrink-0"/>
                        <p className="text-[12px] font-mono leading-relaxed text-red-200 break-words whitespace-pre-wrap selection:bg-red-500/40">
                            {lastError}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};