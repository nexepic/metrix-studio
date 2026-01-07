import { Info, History } from 'lucide-react';
import { useApp } from '@/context/AppStore';
import { cn } from '@/lib/utils';

export const RightActivityBar = () => {
    const { activeRightTab, isRightSidebarOpen, toggleRightSidebar } = useApp();

    const IconBtn = ({ icon: Icon, id, label }: any) => (
        <button
            onClick={() => toggleRightSidebar(id)}
            className={cn(
                "p-3 rounded-lg transition-all duration-200 group relative mb-2",
                activeRightTab === id && isRightSidebarOpen
                    ? "text-indigo-400 bg-indigo-500/10"
                    : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900"
            )}
            title={label}
        >
            <Icon size={20} strokeWidth={1.5} />
            {/* Active Indicator Line on the Right */}
            {activeRightTab === id && isRightSidebarOpen && (
                <div className="absolute right-0 top-2 bottom-2 w-[2px] bg-indigo-500 rounded-l-full" />
            )}
        </button>
    );

    return (
        <div className="w-12 bg-[#050505] border-l border-zinc-800 flex flex-col items-center py-4 z-20 shrink-0">
            <IconBtn icon={Info} id="properties" label="Properties" />
            <IconBtn icon={History} id="history" label="History" />
        </div>
    );
};