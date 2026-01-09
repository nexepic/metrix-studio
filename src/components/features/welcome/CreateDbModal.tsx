import React, { useState } from 'react';
import { X, Folder, Loader2, Sparkles } from 'lucide-react';
import { open } from '@tauri-apps/plugin-dialog';

interface CreateDbModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (parentDir: string, name: string) => Promise<void>;
}

export const CreateDbModal: React.FC<CreateDbModalProps> = ({ isOpen, onClose, onCreate }) => {
    const [name, setName] = useState('');
    const [path, setPath] = useState('');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSelectDir = async () => {
        const selected = await open({ directory: true, multiple: false });
        if (selected) setPath(selected as string);
    };

    const handleCreate = async () => {
        if (!name || !path) return;
        setLoading(true);
        try {
            await onCreate(path, name);
            onClose();
        } catch (e) {
            alert(`Creation Error: ${e}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose} />

            <div className="relative w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] overflow-hidden animate-in zoom-in duration-200">
                <div className="p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/30">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <Sparkles size={18} className="text-emerald-500" /> New Graph Storage
                    </h2>
                    <button onClick={onClose} className="p-1 hover:bg-zinc-800 rounded-md transition-colors text-zinc-500 hover:text-white">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* DB Name */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[2px]">Project Identity</label>
                        <div className="relative flex items-center group">
                            <input
                                autoFocus
                                className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl py-3 pl-4 pr-14 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all placeholder:text-zinc-700"
                                placeholder="e.g. social-network-analysis"
                                value={name}
                                onChange={(e) => setName(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ''))}
                            />
                            <span className="absolute right-4 text-xs font-black text-zinc-600 select-none group-focus-within:text-indigo-400 transition-colors">.mx</span>
                        </div>
                    </div>

                    {/* Location */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[2px]">Storage Location</label>
                        <div className="flex gap-2">
                            <div className="flex-1 bg-zinc-900/50 border border-zinc-800 rounded-xl py-3 px-4 text-sm text-zinc-400 truncate font-mono text-[11px]">
                                {path || "Click to select folder..."}
                            </div>
                            <button
                                onClick={handleSelectDir}
                                className="px-4 bg-zinc-100 hover:bg-white text-black rounded-xl transition-all shadow-lg active:scale-95"
                                title="Browse Filesystem"
                            >
                                <Folder size={18} />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-zinc-900/20 border-t border-zinc-800 flex justify-end gap-3">
                    <button onClick={onClose} className="px-5 py-2 text-xs font-bold text-zinc-500 hover:text-zinc-200 transition-colors uppercase tracking-widest">Cancel</button>
                    <button
                        disabled={!name || !path || loading}
                        onClick={handleCreate}
                        className="px-8 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-[0_0_20px_-5px_rgba(79,70,229,0.5)] flex items-center gap-2"
                    >
                        {loading ? <Loader2 size={16} className="animate-spin" /> : "Init Database"}
                    </button>
                </div>
            </div>
        </div>
    );
};