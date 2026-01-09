import React, { useState } from 'react';
import { X, Folder, Sparkles, Loader2 } from 'lucide-react';
import { open } from '@tauri-apps/plugin-dialog';

interface CreateDbModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (parent: string, name: string) => Promise<void>;
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

    const handleSubmit = async () => {
        if (!name || !path) return;
        setLoading(true);
        try {
            await onCreate(path, name);
            onClose();
        } catch (e) {
            alert(`Creation Failed: ${e}`);
        } finally { setLoading(false); }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />
            <div className="relative w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in duration-200">
                <div className="p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/30">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <Sparkles size={18} className="text-emerald-500" /> New Project
                    </h2>
                    <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors"><X size={20} /></button>
                </div>

                <div className="p-6 space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Database Name</label>
                        <div className="relative flex items-center group">
                            <input
                                autoFocus
                                className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl py-3 pl-4 pr-14 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all"
                                placeholder="my-graph-data"
                                value={name}
                                onChange={(e) => setName(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ''))}
                            />
                            <span className="absolute right-4 text-xs font-black text-zinc-600">.mx</span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Storage Location</label>
                        <div className="flex gap-2">
                            <div className="flex-1 bg-zinc-900/50 border border-zinc-800 rounded-xl py-3 px-4 text-xs text-zinc-400 truncate font-mono">
                                {path || "Select folder..."}
                            </div>
                            <button onClick={handleSelectDir} className="px-4 bg-zinc-100 hover:bg-white text-black rounded-xl transition-all"><Folder size={18} /></button>
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-zinc-900/20 border-t border-zinc-800 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-xs font-bold text-zinc-500 hover:text-zinc-200 uppercase tracking-widest">Cancel</button>
                    <button
                        disabled={!name || !path || loading}
                        onClick={handleSubmit}
                        className="px-8 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2"
                    >
                        {loading ? <Loader2 size={16} className="animate-spin" /> : "Initialize"}
                    </button>
                </div>
            </div>
        </div>
    );
};