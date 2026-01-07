import React, {useEffect, useState} from 'react';
import {Search, X, Minus, Square} from 'lucide-react';
import {getCurrentWindow} from '@tauri-apps/api/window';
import {type as osType} from '@tauri-apps/plugin-os';

export const TitleBar: React.FC = () => {
    const appWindow = getCurrentWindow();
    // Use navigator as initial fallback to prevent flash
    const [isMacOS, setIsMacOS] = useState<boolean>(
        () => navigator.userAgent.toLowerCase().includes('mac')
    );

    useEffect(() => {
        const initOS = async () => {
            try {
                const type = await osType();
                console.log("[System] Detected OS:", type);
                setIsMacOS(type === 'macos');
            } catch (e) {
                console.error("[System] Failed to detect OS via plugin:", e);
                setIsMacOS(navigator.userAgent.toLowerCase().includes('mac'));
            }
        };
        initOS();
    }, []);

    const handleClose = () => appWindow.close();
    const handleMinimize = () => appWindow.minimize();
    const handleToggleMaximize = async () => {
        try {
            const isMaximized = await appWindow.isMaximized();
            if (isMaximized) {
                await appWindow.unmaximize();
            } else {
                await appWindow.maximize();
            }
        } catch (e) {
            console.error("[System] Failed to toggle maximize:", e);
        }
    };

    return (
        <div
            className="h-10 flex items-center justify-between bg-zinc-950 border-b border-zinc-800/50 select-none relative">
            {/* Drag Region */}
            <div data-tauri-drag-region className="absolute inset-0 z-0"/>

            {/* Left Section */}
            <div className="flex items-center gap-2 w-1/3 h-full pl-4 z-10 pointer-events-none">
                {/*
                                               On macOS, we leave this area empty.
                                               With titleBarStyle: "Overlay", the native traffic light buttons will appear here.
                                            */}
                {!isMacOS && (
                    <div className="flex items-center gap-2 px-2 opacity-80">
                        <div
                            className="w-4 h-4 rounded bg-indigo-500 flex items-center justify-center text-[8px] font-bold text-white">M
                        </div>
                        <span className="text-xs font-semibold text-zinc-400 tracking-tight">Metrix</span>
                    </div>
                )}
            </div>

            {/* Center Search Bar */}
            <div className="flex-1 flex justify-center z-10 pointer-events-none">
                <div
                    className="pointer-events-auto flex items-center gap-2 px-3 py-1 bg-zinc-900/50 rounded-md border border-zinc-800 text-zinc-500 w-[240px] transition-colors hover:border-zinc-700 hover:text-zinc-400 group cursor-pointer">
                    <Search className="w-3.5 h-3.5 group-hover:text-indigo-400 transition-colors"/>
                    <span className="text-xs">Search...</span>
                    <kbd className="ml-auto text-[10px] font-mono bg-zinc-800 px-1.5 rounded opacity-50">⌘K</kbd>
                </div>
            </div>

            {/* Right Section */}
            <div className="flex items-center justify-end gap-1 w-1/3 h-full pr-2 z-10 pointer-events-none">
                {!isMacOS && (
                    <div className="flex items-center pointer-events-auto">
                        <WinBtn onClick={handleMinimize}><Minus className="w-3.5 h-3.5"/></WinBtn>
                        <WinBtn onClick={handleToggleMaximize}><Square className="w-3 h-3"/></WinBtn>
                        <WinBtn onClick={handleClose} isClose><X className="w-4 h-4"/></WinBtn>
                    </div>
                )}
            </div>
        </div>
    );
};

interface WinBtnProps {
    children: React.ReactNode;
    onClick: () => void;
    isClose?: boolean;
}

const WinBtn: React.FC<WinBtnProps> = ({children, onClick, isClose}) => (
    <button
        onClick={onClick}
        className={`h-7 w-8 flex items-center justify-center rounded transition-colors ${isClose ? 'hover:bg-red-500 hover:text-white text-zinc-400' : 'hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100'}`}
    >
        {children}
    </button>
);