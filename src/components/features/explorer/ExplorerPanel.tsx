import React from 'react';
import { useApp } from '@/context/AppStore';
import { open } from '@tauri-apps/plugin-dialog';
import { FolderOpen, HardDrive, Clock, ChevronRight } from 'lucide-react';

export const ExplorerPanel: React.FC = () => {
    const { dbPath, connectDatabase } = useApp();

    const handleOpen = async () => {
        try {
            const selected = await open({
                multiple: false,
                filters: [{ name: 'MetrixDB', extensions: ['mx', 'db', 'bin'] }]
            });

            if (selected && typeof selected === 'string') {
                console.log("Selected file:", selected);
                await connectDatabase(selected);
            }
        } catch (e) {
            console.error("Failed to open dialog", e);
        }
    };

    return (
        <div className="h-full flex flex-col">
            {/* Action Bar */}
            <div className="p-4 border-b border-zinc-800/50">
                <button
                    onClick={handleOpen}
                    className="w-full flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300 py-2 px-3 rounded-md text-xs font-medium transition-all"
                >
                    <FolderOpen size={14} />
                    <span>Open Database</span>
                </button>
            </div>

            {/* File Tree / List */}
            <div className="p-2 space-y-6 overflow-auto custom-scrollbar">
                {/* Active Connection Section */}
                {dbPath && (
                    <div className="px-2">
                        <span className="text-[10px] font-bold text-zinc-600 uppercase mb-2 block tracking-wider">
                            Active Connection
                        </span>
                        <div className="flex items-center gap-3 p-2 bg-indigo-500/5 border border-indigo-500/20 rounded-lg text-zinc-200 group cursor-default">
                            <div className="p-1.5 bg-indigo-500/20 rounded-md text-indigo-400">
                                <HardDrive size={14} />
                            </div>
                            <div className="flex flex-col overflow-hidden">
                                <span className="text-xs font-medium truncate">
                                    {dbPath.split(/[/\\]/).pop()}
                                </span>
                                <span className="text-[10px] text-zinc-500 truncate opacity-60">
                                    {dbPath}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Recent Files Section */}
                <div className="px-2">
                    <span className="text-[10px] font-bold text-zinc-600 uppercase mb-2 block tracking-wider">
                        Recent
                    </span>
                    <div className="space-y-1">
                        {[1, 2, 3].map((_, i) => (
                            <div
                                key={i}
                                className="flex items-center gap-2 p-2 hover:bg-zinc-900 rounded-md text-zinc-500 hover:text-zinc-200 cursor-pointer transition-colors group"
                            >
                                <Clock size={12} />
                                <span className="text-xs">graph_dump_2024_{i}.mx</span>
                                <ChevronRight size={12} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};