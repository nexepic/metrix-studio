import React from 'react';
import { useApp } from '@/context/AppStore';
import { ExplorerPanel } from './ExplorerPanel'; // Import the file content viewer
import { Search } from 'lucide-react';

export const LeftSidebar: React.FC = () => {
    const { activeLeftTab } = useApp();

    return (
        <div className="h-full flex flex-col bg-transparent">
            {/* Header / Title Area */}
            <div className="h-9 border-b border-white/5 flex items-center px-4 bg-zinc-900/20">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                    {activeLeftTab}
                </span>
            </div>

            {/* Content Switcher */}
            <div className="flex-1 overflow-hidden relative">
                {activeLeftTab === 'explorer' && (
                    <ExplorerPanel />
                )}

                {activeLeftTab === 'search' && (
                    // Placeholder for future Search functionality
                    <div className="flex flex-col items-center justify-center h-full text-zinc-600 p-6 text-center">
                        <Search size={32} className="mb-3 opacity-20" />
                        <p className="text-xs">Global search not implemented yet.</p>
                    </div>
                )}

                {activeLeftTab === 'settings' && (
                    <div className="p-4 text-xs text-zinc-500">Settings Panel</div>
                )}
            </div>
        </div>
    );
};