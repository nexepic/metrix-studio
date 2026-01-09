import React, {useState, useEffect} from "react";
import {listen} from "@tauri-apps/api/event";
import {
    FolderOpen, Database, ChevronRight, Plus,
    ArrowLeft, Clock, Trash2, Search
} from "lucide-react";
import {useApp} from "@/context/AppStore";
import {useDatabaseActions} from "@/hooks/useDatabaseActions";
import {APP_CONFIG} from "@/config/app";
import metrixIcon from "@/assets/icon.svg";
import {openUrl} from '@tauri-apps/plugin-opener';
import {CreateDbModal} from "./CreateDbModal";
import {cn} from "@/lib/utils";
import {message} from '@tauri-apps/plugin-dialog';

type WelcomeView = 'home' | 'history';

export const WelcomeScreen: React.FC = () => {
    const {
        connectDatabase,
        createNewDatabase,
        recentFiles,
        removeRecentFile
    } = useApp();

    const {openDatabaseDialog} = useDatabaseActions();

    // --- Component State ---
    const [view, setView] = useState<WelcomeView>('home');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    // --- 1. Connection Logic with Native Error Feedback ---
    const safeConnect = async (path: string) => {
        try {
            // Attempt connection (AppStore handles the connection state)
            await connectDatabase(path);
        } catch (e: any) {
            // Extract meaningful error message
            const errorMsg = typeof e === 'string' ? e : (e?.message || "Internal database integrity error.");

            // Show Native OS Dialog for professional feedback
            await message(
                `Failed to open database at:\n${path}\n\nReason: ${errorMsg}\n\nThis project will be removed from your history.`,
                {title: 'Database Error', kind: 'error'}
            );

            // Prune the invalid path from recents and localStorage
            removeRecentFile(path);
        }
    };

    // --- 2. Tauri v2 Drag & Drop Listener ---
    useEffect(() => {
        const unlistenPromise = listen<{ paths: string[] }>('tauri://drag-drop', (event) => {
            const files = event.payload.paths;
            if (files && files.length > 0) safeConnect(files[0]);
        });
        return () => {
            unlistenPromise.then(unlisten => unlisten());
        };
    }, []);

    // --- 3. External Link Handler ---
    const handleLink = async (url: string) => {
        try {
            await openUrl(url);
        } catch (e) {
            console.error(e);
        }
    };

    // --- 4. Sub-View: Main Home Screen ---
    const HomeView = () => (
        <div
            className="flex flex-col items-center gap-12 w-full max-w-[840px] animate-in fade-in zoom-in duration-500 px-8">
            {/* Branding Section */}
            <div className="flex flex-col items-center gap-6">
                <div className="p-5 bg-zinc-900/50 rounded-3xl border border-zinc-800/50 shadow-2xl backdrop-blur-xl">
                    <img src={metrixIcon} alt="Metrix Logo"
                         className="w-14 h-14 md:w-16 md:h-16 opacity-95 drop-shadow-lg"/>
                </div>
                <div className="text-center space-y-2">
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent pb-1">
                        {APP_CONFIG.name}
                    </h1>
                    <p className="text-zinc-400 text-sm font-medium tracking-wide">
                        High-Performance Graph Engine Client
                    </p>
                </div>
            </div>

            {/* Twin Action Cards */}
            <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6">
                <ClassicActionCard
                    title="Open Existing"
                    desc="Select a local .mx database folder or drag & drop"
                    icon={<FolderOpen size={32} strokeWidth={1.5}/>}
                    onClick={openDatabaseDialog}
                    theme="indigo"
                />
                <ClassicActionCard
                    title="New Project"
                    desc="Initialize a fresh graph storage with a new identity"
                    icon={<Plus size={32} strokeWidth={1.5}/>}
                    onClick={() => setIsModalOpen(true)}
                    theme="emerald"
                />
            </div>

            {/* Navigation to History View */}
            {recentFiles.length > 0 && (
                <button
                    onClick={() => setView('history')}
                    className="group flex items-center gap-3 px-6 py-3 rounded-full bg-zinc-900/30 border border-zinc-800 hover:border-zinc-600 transition-all text-zinc-500 hover:text-zinc-200"
                >
                    <Clock size={14} className="text-zinc-500 group-hover:text-indigo-400 transition-colors"/>
                    <span
                        className="text-[10px] font-black uppercase tracking-[2px]">Recent Connections ({recentFiles.length})</span>
                    <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform"/>
                </button>
            )}
        </div>
    );

    // --- 5. Sub-View: Recent Projects History ---
    const HistoryView = () => {
        const filtered = recentFiles.filter(p => p.toLowerCase().includes(searchTerm.toLowerCase()));

        return (
            <div
                className="flex flex-col w-full max-w-[700px] h-[500px] bg-[#0c0c0e]/80 border border-zinc-800 rounded-3xl backdrop-blur-xl animate-in slide-in-from-bottom-4 duration-500 overflow-hidden shadow-2xl">
                {/* Header with Search */}
                <div className="p-6 border-b border-zinc-800/50 flex items-center justify-between bg-zinc-900/30">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setView('home')}
                                className="p-2 hover:bg-zinc-800 rounded-xl text-zinc-400 hover:text-white transition-all">
                            <ArrowLeft size={20}/>
                        </button>
                        <h2 className="text-lg font-bold text-white tracking-tight">Recent Projects</h2>
                    </div>
                    <div className="relative flex items-center group">
                        <Search
                            className="absolute left-3 text-zinc-600 group-focus-within:text-indigo-500 transition-colors"
                            size={14}/>
                        <input
                            placeholder="Search projects..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-zinc-950/50 border border-zinc-800 rounded-xl py-2 pl-9 pr-4 text-xs text-zinc-300 focus:outline-none focus:border-indigo-500 w-48 transition-all placeholder:text-zinc-600"
                        />
                    </div>
                </div>

                {/* List Container */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2">
                    {filtered.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-zinc-700">
                            <Database size={48} strokeWidth={1} className="mb-2 opacity-20"/>
                            <p className="text-xs uppercase font-bold tracking-widest opacity-50 text-zinc-500">Empty</p>
                        </div>
                    ) : (
                        filtered.map((path) => (
                            <div
                                key={path}
                                onClick={() => safeConnect(path)}
                                className="group flex items-center gap-5 p-4 rounded-2xl bg-zinc-900/40 hover:bg-zinc-800/80 border border-transparent hover:border-zinc-700/50 cursor-pointer transition-all duration-200 shadow-sm"
                            >
                                <div
                                    className="p-3 bg-zinc-950 rounded-xl text-zinc-600 group-hover:text-indigo-400 transition-colors shadow-inner">
                                    <Database size={18}/>
                                </div>
                                <div className="flex flex-col flex-1 overflow-hidden">
                                    <span
                                        className="text-sm font-semibold text-zinc-200 group-hover:text-white truncate">
                                        {path.split(/[/\\]/).pop()}
                                    </span>
                                    <span
                                        className="text-[10px] text-zinc-400 truncate font-mono opacity-60 mt-0.5 tracking-tight">
                                        {path}
                                    </span>
                                </div>
                                <div
                                    className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            removeRecentFile(path);
                                        }}
                                        className="p-2 hover:bg-red-500/10 text-zinc-600 hover:text-red-500 rounded-lg transition-all"
                                        title="Remove permanently"
                                    >
                                        <Trash2 size={16}/>
                                    </button>
                                    <ChevronRight size={18} className="text-indigo-400"/>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        );
    };

    return (
        <div
            className="h-full w-full bg-[#09090b] text-zinc-100 relative overflow-hidden select-none font-sans flex flex-col">
            {/* Ambient Background Effects */}
            <div
                className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-indigo-900/10 rounded-full blur-[130px] pointer-events-none"/>
            <div
                className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-emerald-900/5 rounded-full blur-[130px] pointer-events-none"/>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col items-center justify-center overflow-hidden w-full pt-10">
                {view === 'home' ? <HomeView/> : <HistoryView/>}
            </div>

            {/* Create DB Modal Overlay */}
            <CreateDbModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onCreate={createNewDatabase}
            />

            {/* Global Footer */}
            <div
                className="h-20 shrink-0 flex flex-col items-center justify-center gap-3 pb-4 bg-gradient-to-t from-[#09090b] via-[#09090b] to-transparent z-20 w-full border-t border-zinc-800/20">
                <div className="flex gap-10 text-[10px] font-black text-zinc-600 uppercase tracking-[2px]">
                    <button onClick={() => handleLink(APP_CONFIG.links.docs)}
                            className="hover:text-white transition-colors">Documentation
                    </button>
                    <button onClick={() => handleLink(APP_CONFIG.links.github)}
                            className="hover:text-white transition-colors">GitHub
                    </button>
                </div>
                <div className="text-[9px] text-zinc-700 font-mono tracking-[4px] opacity-40 uppercase">
                    {APP_CONFIG.name} • {APP_CONFIG.version}
                </div>
            </div>
        </div>
    );
};

// --- Sub-Component: Classic Action Card ---
const ClassicActionCard = ({title, desc, icon, onClick, theme}: any) => {
    const [hover, setHover] = useState(false);

    const themeStyles: any = {
        indigo: 'bg-gradient-to-br from-indigo-500/40 via-purple-500/40 to-blue-500/40 shadow-indigo-500/10',
        emerald: 'bg-gradient-to-br from-emerald-500/40 via-teal-500/40 to-cyan-500/40 shadow-emerald-500/10'
    };

    return (
        <div
            onClick={onClick}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            className={cn(
                "cursor-pointer group relative p-[1px] rounded-2xl transition-all duration-500 flex-1",
                hover ? themeStyles[theme] + " scale-[1.02] shadow-2xl" : "bg-zinc-800/40"
            )}
        >
            <div
                className="bg-[#0c0c0e]/95 rounded-[15px] p-8 flex flex-col items-center gap-5 border border-zinc-800/60 relative overflow-hidden h-full backdrop-blur-sm">
                {/* Inner Glow Effect */}
                <div
                    className={cn("absolute inset-0 transition-opacity duration-500 opacity-0", hover && "opacity-100", theme === 'indigo' ? 'bg-indigo-500/5' : 'bg-emerald-500/5')}/>

                {/* Animated Icon Container */}
                <div className={cn(
                    "p-4 rounded-2xl border transition-all duration-300 relative z-10",
                    hover
                        ? (theme === 'indigo' ? "bg-zinc-900 border-indigo-500/40 text-indigo-400" : "bg-zinc-900 border-emerald-500/40 text-emerald-400") + " scale-110 shadow-lg"
                        : "bg-zinc-900/50 border-zinc-800 text-zinc-500"
                )}>
                    {icon}
                </div>

                {/* Description Text */}
                <div className="text-center relative z-10">
                    <h3 className="text-lg font-bold text-zinc-100 group-hover:text-white transition-colors tracking-tight">{title}</h3>
                    <p className="text-xs text-zinc-500 mt-2 group-hover:text-zinc-400 transition-colors leading-relaxed">{desc}</p>
                </div>
            </div>
        </div>
    );
};