import React, {useState} from 'react';
import {Search, X, Minus, Square} from 'lucide-react';
import {getCurrentWindow} from '@tauri-apps/api/window';
import {useApp} from '@/context/AppStore';
import {cn} from '@/lib/utils';

export const TitleBar: React.FC = () => {
    const {isConnected} = useApp();
    const appWindow = getCurrentWindow();

    const [isMacOS] = useState<boolean>(
        () => navigator.userAgent.toLowerCase().includes('mac')
    );

    const handleToggleMaximize = async () => {
        try {
            const isMaximized = await appWindow.isMaximized();
            isMaximized ? await appWindow.unmaximize() : await appWindow.maximize();
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div
            className={cn(
                // 1. absolute + top-0 ensures it floats OVER the Welcome/Main views
                // 2. z-[100] keeps it above all other elements
                "absolute top-0 left-0 right-0 h-10 flex items-center justify-between select-none transition-all duration-500 z-[100]",
                isConnected
                    ? "bg-zinc-950/80 border-b border-zinc-800/50 backdrop-blur-md"
                    : "bg-transparent border-b-transparent backdrop-blur-none"
            )}
        >
            {/* Drag Region */}
            <div data-tauri-drag-region className="absolute inset-0 z-0"/>

            {/* Left Section */}
            <div className="flex items-center gap-2 w-1/3 h-full pl-4 z-10 pointer-events-none">
                {!isMacOS && isConnected && (
                    <div className="flex items-center gap-2 px-2 opacity-80 animate-in fade-in duration-500">
                        <div
                            className="w-4 h-4 rounded bg-indigo-500 flex items-center justify-center text-[8px] font-bold text-white">M
                        </div>
                        <span className="text-xs font-semibold text-zinc-400 tracking-tight">Metrix</span>
                    </div>
                )}
            </div>

            {/* Center Section: Search (Only visible in App) */}
            <div className="flex-1 flex justify-center z-10 pointer-events-none">
                {isConnected && (
                    <div
                        className="pointer-events-auto flex items-center gap-2 px-3 py-1 bg-zinc-900/50 rounded-md border border-zinc-800 text-zinc-500 w-[240px] transition-all hover:border-zinc-700 hover:text-zinc-400 group cursor-pointer">
                        <Search className="w-3.5 h-3.5 group-hover:text-indigo-400 transition-colors"/>
                        <span className="text-xs">Search...</span>
                        <kbd className="ml-auto text-[10px] font-mono bg-zinc-800 px-1.5 rounded opacity-50">⌘K</kbd>
                    </div>
                )}
            </div>

            {/* Right Section */}
            <div className="flex items-center justify-end gap-1 w-1/3 h-full pr-2 z-10 pointer-events-none">
                {!isMacOS && (
                    <div className="flex items-center pointer-events-auto">
                        <WinBtn onClick={() => appWindow.minimize()}><Minus className="w-3.5 h-3.5"/></WinBtn>
                        <WinBtn onClick={handleToggleMaximize}><Square className="w-3 h-3"/></WinBtn>
                        <WinBtn onClick={() => appWindow.close()} isClose><X className="w-4 h-4"/></WinBtn>
                    </div>
                )}
            </div>
        </div>
    );
};

const WinBtn = ({children, onClick, isClose}: any) => (
    <button
        onClick={onClick}
        className={cn(
            "h-7 w-8 flex items-center justify-center rounded transition-colors",
            isClose ? "hover:bg-red-500 hover:text-white text-zinc-400" : "hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100"
        )}
    >
        {children}
    </button>
);