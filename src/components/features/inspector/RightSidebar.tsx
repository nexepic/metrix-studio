import { useApp } from '@/context/AppStore';
import { Inspector } from './Inspector';
import { HistoryList } from './HistoryList';

export const RightSidebar = () => {
    const { activeRightTab } = useApp();

    return (
        <div className="h-full flex flex-col bg-transparent">
            {/* Header / Title */}
            <div className="h-9 border-b border-white/5 flex items-center px-4 bg-zinc-900/20">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                    {activeRightTab}
                </span>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
                {activeRightTab === 'properties' ? <Inspector /> : <HistoryList />}
            </div>
        </div>
    );
};