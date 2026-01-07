import React from 'react';
import { Database, Search, Settings, Layers } from 'lucide-react';
import { useApp } from '@/context/AppStore';
import { cn } from '@/lib/utils';

export const LeftActivityBar: React.FC = () => {
    const { activeLeftTab, isLeftSidebarOpen, toggleLeftSidebar } = useApp();

    // Helper component for the icon button
    const IconBtn = ({ icon: Icon, id, label, isBottom = false }: any) => (
        <button
            onClick={() => toggleLeftSidebar(id)}
            className={cn(
                "p-3 rounded-lg transition-all duration-200 group relative mb-2",
                // Active State: distinct background and text color
                activeLeftTab === id && isLeftSidebarOpen
                    ? "text-indigo-400 bg-indigo-500/10"
                    : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900",
                // Push Settings to the bottom
                isBottom && "mt-auto"
            )}
            title={label}
        >
            <Icon size={20} strokeWidth={1.5} />

            {/* Active Indicator (Left Side) */}
            {activeLeftTab === id && isLeftSidebarOpen && (
                <div className="absolute left-0 top-2 bottom-2 w-[3px] bg-indigo-500 rounded-r-full" />
            )}
        </button>
    );

    return (
        <div className="w-12 bg-[#050505] border-r border-zinc-800 flex flex-col items-center py-4 z-20 shrink-0">
            {/* Primary Features */}
            <IconBtn icon={Database} id="explorer" label="Database Explorer" />
            <IconBtn icon={Search} id="search" label="Search" />
            <IconBtn icon={Layers} id="schema" label="Schema" />

            {/* Spacer */}
            <div className="flex-1" />

            {/* Bottom Actions */}
            <IconBtn icon={Settings} id="settings" label="Settings" />
        </div>
    );
};