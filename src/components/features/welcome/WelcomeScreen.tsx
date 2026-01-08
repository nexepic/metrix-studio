import { useState, useEffect } from "react";
import { listen } from "@tauri-apps/api/event";
import { FolderOpen, Database, ChevronRight } from "lucide-react";
import { useApp } from "@/context/AppStore";
import { useDatabaseActions } from "@/hooks/useDatabaseActions";
import { APP_CONFIG } from "@/config/app";
import metrixIcon from "@/assets/icon.svg";
import { openUrl } from '@tauri-apps/plugin-opener';

export const WelcomeScreen = () => {
    const { connectDatabase, recentFiles } = useApp();
    const { openDatabaseDialog } = useDatabaseActions();
    const [isHovering, setIsHovering] = useState(false);

    useEffect(() => {
        const unlistenPromise = listen<{ paths: string[] }>('tauri://drag-drop', (event) => {
            const files = event.payload.paths;
            if (files && files.length > 0) connectDatabase(files[0]);
        });
        return () => { unlistenPromise.then(unlisten => unlisten()); };
    }, []);

    // Helper for external links
    const handleLink = async (url: string) => {
        try {
            await openUrl(url);
        } catch (e) {
            console.error("Failed to open link:", e);
        }
    };

    return (
        <div className="h-full w-full bg-[#09090b] text-zinc-100 relative overflow-hidden select-none font-sans flex flex-col">

            <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-indigo-900/10 rounded-full blur-[130px] pointer-events-none"/>
            <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-purple-900/10 rounded-full blur-[130px] pointer-events-none"/>

            <div className="flex-1 flex flex-col items-center justify-center overflow-hidden w-full">
                {/*
                   Main Container:
                   Added 'max-h-full' and 'overflow-y-auto' here if the whole page needs scroll,
                   but usually centering is better.
                */}
                <div className="flex flex-col items-center gap-8 w-full max-w-[480px] p-6 animate-in fade-in zoom-in duration-700">

                    {/* 1. Header */}
                    <div className="flex flex-col items-center gap-5">
                        <div className="p-4 bg-zinc-900/50 rounded-3xl border border-zinc-800/50 shadow-2xl backdrop-blur-xl">
                            <img src={metrixIcon} alt="Metrix Logo" className="w-12 h-12 md:w-16 md:h-16 opacity-90 drop-shadow-lg"/>
                        </div>
                        <div className="text-center space-y-1">
                            <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent pb-1">
                                {APP_CONFIG.name}
                            </h1>
                            <p className="text-zinc-400 text-sm md:text-base font-medium tracking-wide">
                                High-Performance Graph Engine Client
                            </p>
                        </div>
                    </div>

                    {/* 2. Action Card */}
                    <div
                        onClick={openDatabaseDialog}
                        onMouseEnter={() => setIsHovering(true)}
                        onMouseLeave={() => setIsHovering(false)}
                        className={`
                            w-full cursor-pointer group relative p-[1px] rounded-2xl transition-all duration-500
                            ${isHovering ? 'bg-gradient-to-br from-indigo-500/40 via-purple-500/40 to-blue-500/40 shadow-[0_0_40px_-10px_rgba(99,102,241,0.25)] scale-[1.02]' : 'bg-zinc-800/40'}
                        `}
                    >
                        <div className="bg-[#0c0c0e] rounded-[15px] p-6 flex flex-col items-center gap-3 border border-zinc-800/60 relative overflow-hidden h-full">
                            <div className={`absolute inset-0 bg-indigo-500/5 transition-opacity duration-500 ${isHovering ? 'opacity-100' : 'opacity-0'}`}/>
                            <div className={`p-3.5 rounded-full border transition-all duration-300 relative z-10 ${isHovering ? 'bg-zinc-900 border-indigo-500/30 text-indigo-400' : 'bg-zinc-900/50 border-zinc-800 text-zinc-500'}`}>
                                <FolderOpen size={24} strokeWidth={1.5}/>
                            </div>
                            <div className="text-center relative z-10">
                                <h3 className="text-base font-semibold text-zinc-100 group-hover:text-white transition-colors">Open Database</h3>
                                <p className="text-xs text-zinc-500 mt-1 group-hover:text-zinc-400 transition-colors">Select a local database folder or drag & drop</p>
                            </div>
                        </div>
                    </div>

                    {/* 3. Recent Projects */}
                    {recentFiles && recentFiles.length > 0 && (
                        <div className="w-full flex flex-col gap-2 max-h-[220px] px-1">
                            <div className="flex items-center justify-between px-2 pb-1 sticky top-0 z-10">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Recent</span>
                            </div>

                            {/*
                                SCROLLBAR FIX:
                                'overflow-hidden hover:overflow-y-auto' makes scrollbar invisible until hovered.
                                'custom-scrollbar' class (defined in CSS) handles the styling.
                            */}
                            <div className="flex flex-col gap-2 overflow-hidden hover:overflow-y-auto custom-scrollbar pr-1 pb-2">
                                {/* Limit display to 5 items max here if not already limited in store */}
                                {recentFiles.slice(0, 5).map((path, i) => (
                                    <div
                                        key={i}
                                        onClick={() => connectDatabase(path)}
                                        className="
                                            group flex items-center gap-3 p-3 rounded-xl
                                            bg-zinc-900/30 hover:bg-zinc-800/80 border border-transparent hover:border-zinc-700/80
                                            cursor-pointer transition-all duration-200 shrink-0
                                        "
                                    >
                                        <div className="p-2 bg-zinc-900 rounded-lg text-zinc-600 group-hover:text-indigo-400 transition-colors">
                                            <Database size={14}/>
                                        </div>
                                        <div className="flex flex-col flex-1 overflow-hidden min-w-0">
                                            <span className="text-xs font-medium text-zinc-300 group-hover:text-white truncate">
                                                {path.split(/[/\\]/).pop()}
                                            </span>
                                            <span className="text-[10px] text-zinc-500 group-hover:text-zinc-400 truncate font-mono direction-rtl">
                                                {path}
                                            </span>
                                        </div>
                                        <ChevronRight size={14} className="text-zinc-700 group-hover:text-zinc-500 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0"/>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer */}
            <div className="h-16 shrink-0 flex flex-col items-center justify-center gap-2 pb-2 bg-gradient-to-t from-[#09090b] to-transparent z-20 w-full">
                <div className="flex gap-6 text-xs font-medium text-zinc-500">
                    <button
                        onClick={() => handleLink(APP_CONFIG.links.docs)}
                        className="hover:text-zinc-300 transition-colors hover:underline underline-offset-4"
                    >
                        Documentation
                    </button>
                    <button
                        onClick={() => handleLink(APP_CONFIG.links.github)}
                        className="hover:text-zinc-300 transition-colors hover:underline underline-offset-4"
                    >
                        GitHub
                    </button>
                </div>
                <div className="text-[10px] text-zinc-700 font-mono tracking-tight opacity-60">
                    {APP_CONFIG.name} v{APP_CONFIG.version} • {APP_CONFIG.driver}
                </div>
            </div>
        </div>
    );
};