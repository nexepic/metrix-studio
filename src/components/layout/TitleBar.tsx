import React, { useEffect, useState } from 'react';
import { Search, X, Minus, Maximize2, Square } from 'lucide-react';
import { getCurrentWindow } from '@tauri-apps/api/window';
// Import the plugin function
import { type as osType } from '@tauri-apps/plugin-os';

export const TitleBar: React.FC = () => {
    const appWindow = getCurrentWindow();
    // Default to false or null to prevent layout shifts
    const [isMacOS, setIsMacOS] = useState<boolean>(false);

    useEffect(() => {
        const initOS = async () => {
            try {
                // This call requires the Rust plugin to be initialized in lib.rs
                const type = await osType();
                console.log("[System] Detected OS:", type);
                setIsMacOS(type === 'macos');
            } catch (e) {
                console.error("[System] Failed to detect OS via plugin:", e);
                // Fallback to User Agent if plugin fails (Safety net)
                setIsMacOS(navigator.userAgent.toLowerCase().includes('mac'));
            }
        };
        initOS();
    }, []);

    // --- Window Control Handlers ---

    const handleClose = () => appWindow.close();
    const handleMinimize = () => appWindow.minimize();

    const handleExpand = async () => {
        if (isMacOS) {
            // MacOS: Toggle Fullscreen (Mission Control / New Space)
            const isFullscreen = await appWindow.isFullscreen();
            await appWindow.setFullscreen(!isFullscreen);
        } else {
            // Windows: Toggle Maximize
            const isMaximized = await appWindow.isMaximized();
            if (isMaximized) {
                await appWindow.unmaximize();
            } else {
                await appWindow.maximize();
            }
        }
    };

    return (
        <div className="h-10 flex items-center justify-between bg-zinc-950 border-b border-zinc-800/50 select-none relative">

            {/* Drag Region */}
            <div data-tauri-drag-region className="absolute inset-0 z-0" />

            {/* Left Section */}
            <div className="flex items-center gap-2 w-1/3 h-full pl-4 z-10 pointer-events-none">
                {isMacOS ? (
                    // MacOS Custom Traffic Lights
                    <div className="flex gap-2 group pointer-events-auto">
                        <MacBtn
                            color="bg-[#FF5F56]"
                            borderColor="border-[#E0443E]"
                            onClick={handleClose}
                        >
                            <X size={8} className="text-black/60 opacity-0 group-hover:opacity-100 transition-opacity" strokeWidth={3}/>
                        </MacBtn>

                        <MacBtn
                            color="bg-[#FFBD2E]"
                            borderColor="border-[#DEA123]"
                            onClick={handleMinimize}
                        >
                            <Minus size={8} className="text-black/60 opacity-0 group-hover:opacity-100 transition-opacity" strokeWidth={4}/>
                        </MacBtn>

                        <MacBtn
                            color="bg-[#27C93F]"
                            borderColor="border-[#1AAB29]"
                            onClick={handleExpand}
                        >
                            <Maximize2 size={8} className="text-black/60 opacity-0 group-hover:opacity-100 transition-opacity" strokeWidth={3}/>
                        </MacBtn>
                    </div>
                ) : (
                    // Windows Logo
                    <div className="flex items-center gap-2 px-2 opacity-80">
                        <div className="w-4 h-4 rounded bg-indigo-500 flex items-center justify-center text-[8px] font-bold text-white">M</div>
                        <span className="text-xs font-semibold text-zinc-400 tracking-tight">Metrix</span>
                    </div>
                )}
            </div>

            {/* Center Search Bar */}
            <div className="flex-1 flex justify-center z-10 pointer-events-none">
                <div className="pointer-events-auto flex items-center gap-2 px-3 py-1 bg-zinc-900/50 rounded-md border border-zinc-800 text-zinc-500 w-[240px] transition-colors hover:border-zinc-700 hover:text-zinc-400 group cursor-pointer">
                    <Search className="w-3.5 h-3.5 group-hover:text-indigo-400 transition-colors"/>
                    <span className="text-xs">Search...</span>
                    <kbd className="ml-auto text-[10px] font-mono bg-zinc-800 px-1.5 rounded opacity-50">⌘K</kbd>
                </div>
            </div>

            {/* Right Section (Windows Controls) */}
            <div className="flex items-center justify-end gap-1 w-1/3 h-full pr-2 z-10">
                {!isMacOS && (
                    <div className="flex items-center pointer-events-auto">
                        <WinBtn onClick={handleMinimize}><Minus className="w-3.5 h-3.5"/></WinBtn>
                        <WinBtn onClick={handleExpand}><Square className="w-3 h-3"/></WinBtn>
                        <WinBtn onClick={handleClose} isClose><X className="w-4 h-4"/></WinBtn>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- Helper Components ---

interface MacBtnProps {
    color: string;
    borderColor: string;
    children: React.ReactNode;
    onClick: () => void;
}

const MacBtn: React.FC<MacBtnProps> = ({color, borderColor, children, onClick}) => (
    <button
        onClick={onClick}
        className={`w-3 h-3 rounded-full flex items-center justify-center border ${borderColor} ${color} active:opacity-80 transition-all shadow-sm`}
    >
        {children}
    </button>
);

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