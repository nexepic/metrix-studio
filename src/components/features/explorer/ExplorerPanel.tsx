import React from 'react';
import { useApp } from '@/context/AppStore';
import { FolderOpen, HardDrive, Clock, ChevronRight } from 'lucide-react';
import { useDatabaseActions } from "@/hooks/useDatabaseActions";

export const ExplorerPanel: React.FC = () => {
    const { dbPath, recentFiles, connectDatabase } = useApp();
    const { openDatabaseDialog } = useDatabaseActions();

    return (
        <div className="h-full flex flex-col">
            <div className="p-4 border-b border-zinc-800/50">
                <button
                    onClick={openDatabaseDialog}
                    className="w-full flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/50 hover:border-zinc-600 text-zinc-300 py-2 px-3 rounded-md text-xs font-medium transition-all shadow-sm"
                >
                    <FolderOpen size={14} className="text-indigo-400"/>
                    <span>Open Database</span>
                </button>
            </div>

            <div className="p-3 space-y-6 overflow-auto custom-scrollbar">
                {dbPath && (
                    <div className="px-1">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase mb-2 block tracking-wider px-2">Active</span>
                        <div className="flex items-center gap-3 p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-zinc-200 group cursor-default">
                            <div className="p-1.5 bg-indigo-500/20 rounded-md text-indigo-400"><HardDrive size={14}/></div>
                            <div className="flex flex-col overflow-hidden">
                                <span className="text-xs font-semibold truncate text-zinc-200">{dbPath.split(/[/\\]/).pop()}</span>
                                <span className="text-[10px] text-zinc-500 truncate opacity-80" title={dbPath}>{dbPath}</span>
                            </div>
                        </div>
                    </div>
                )}

                <div className="px-1">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase mb-2 block tracking-wider px-2">Recent</span>
                    <div className="space-y-1">
                        {recentFiles.length === 0 && <span className="text-xs text-zinc-600 px-2 italic">No recent files</span>}
                        {recentFiles.map((path, i) => (
                            <div
                                key={i}
                                onClick={() => connectDatabase(path)}
                                className="flex items-center gap-2 p-2 px-3 hover:bg-zinc-800/50 rounded-md text-zinc-400 hover:text-zinc-100 cursor-pointer transition-all group"
                            >
                                <Clock size={12} className="text-zinc-600 group-hover:text-indigo-400 transition-colors"/>
                                <span className="text-xs truncate" title={path}>{path.split(/[/\\]/).pop()}</span>
                                <ChevronRight size={12} className="ml-auto opacity-0 group-hover:opacity-100 text-zinc-600"/>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};