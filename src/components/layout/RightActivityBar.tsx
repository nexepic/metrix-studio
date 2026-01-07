import { Info, History, BrainCircuit } from 'lucide-react';
import { useApp } from '@/context/AppStore';
import { cn } from '@/lib/utils';

export const RightActivityBar = () => {
    const { activeTopPanel, activeBottomPanel, toggleTopPanel, toggleBottomPanel } = useApp();

    const TopIconBtn = ({ icon: Icon, id, label }: any) => {
        const isActive = activeTopPanel === id;
        return (
            <button
                onClick={() => toggleTopPanel(id)}
                className={cn(
                    "p-3 rounded-lg transition-all duration-200 group relative mb-2",
                    isActive ? "text-indigo-400 bg-indigo-500/10" : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900"
                )}
                title={label}
            >
                <Icon size={20} strokeWidth={1.5} />
                {isActive && <div className="absolute right-0 top-2 bottom-2 w-[2px] bg-indigo-500 rounded-l-full" />}
            </button>
        );
    };

    const BottomIconBtn = ({ icon: Icon, id, label }: any) => {
        const isActive = activeBottomPanel === id;
        return (
            <button
                onClick={() => toggleBottomPanel(id)}
                className={cn(
                    "p-3 rounded-lg transition-all duration-200 group relative mt-auto",
                    isActive ? "text-indigo-400 bg-indigo-500/10" : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900"
                )}
                title={label}
            >
                <Icon size={20} strokeWidth={1.5} />
                {isActive && <div className="absolute right-0 top-2 bottom-2 w-[2px] bg-indigo-500 rounded-l-full" />}
            </button>
        );
    };

    return (
        <div className="w-12 bg-[#050505] border-l border-zinc-800 flex flex-col items-center py-4 z-20 shrink-0 h-full">
            <TopIconBtn icon={Info} id="properties" label="Properties" />
            <TopIconBtn icon={History} id="history" label="History" />
            <div className="flex-1" />
            <BottomIconBtn icon={BrainCircuit} id="analysis" label="Graph Algorithms" />
        </div>
    );
};