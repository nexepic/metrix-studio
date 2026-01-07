import {useState, useEffect} from "react";
import {listen} from "@tauri-apps/api/event";
import {FolderOpen} from "lucide-react";
import {useApp} from "@/context/AppStore";
import {useDatabaseActions} from "@/hooks/useDatabaseActions.ts";
import metrixIcon from "@/assets/icon.svg";

export const WelcomeScreen = () => {
    const {connectDatabase} = useApp();
    const [isHovering, setIsHovering] = useState(false);
    const {openDatabaseDialog} = useDatabaseActions();

    useEffect(() => {
        const unlistenPromise = listen<string[]>('tauri://file-drop', async (event) => {
            const files = event.payload;
            if (files && files.length > 0) connectDatabase(files[0]);
        });
        return () => {
            unlistenPromise.then(unlisten => unlisten());
        };
    }, []);

    return (
        <div
            className="h-full w-full flex flex-col items-center justify-center bg-[#09090b] text-zinc-100 relative overflow-hidden select-none">
            {/* Ambient Background - slightly increased opacity for warmth */}
            <div
                className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-900/20 rounded-full blur-[120px] pointer-events-none"/>
            <div
                className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-900/10 rounded-full blur-[120px] pointer-events-none"/>

            <div className="z-10 flex flex-col items-center gap-8 animate-in fade-in zoom-in duration-700">
                <div className="flex flex-col items-center gap-4">
                    <div className="p-4 bg-zinc-900/80 rounded-2xl border border-zinc-800 shadow-2xl backdrop-blur-sm">
                        {/*
                                        Replaced Cpu icon component with an img tag pointing to your asset.
                                        Note: The 'text-indigo-400' class has been removed as it does not affect <img> tags.
                                        Ensure your SVG file has the correct color hardcoded.
                                    */}
                        <img
                            src={metrixIcon}
                            alt="Metrix Logo"
                            className="w-12 h-12"
                        />
                    </div>
                    <div className="text-center">
                        <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-br from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
                            Metrix Studio
                        </h1>
                        {/* Improved Contrast: zinc-500 -> zinc-400 */}
                        <p className="text-zinc-400 mt-2 text-sm font-medium tracking-wide">
                            High-Performance Graph Engine Client
                        </p>
                    </div>
                </div>

                <div
                    onClick={openDatabaseDialog}
                    onMouseEnter={() => setIsHovering(true)}
                    onMouseLeave={() => setIsHovering(false)}
                    className={`
                                    cursor-pointer group relative w-[380px] p-8 rounded-xl border transition-all duration-300
                                    flex flex-col items-center gap-4 text-center
                                    ${isHovering
                        ? 'bg-zinc-900/90 border-indigo-500/50 shadow-[0_0_40px_-10px_rgba(99,102,241,0.3)]'
                        : 'bg-zinc-900/40 border-zinc-800'}
                                `}
                >
                    <div
                        className={`p-3 rounded-full border transition-transform duration-300 ${isHovering ? 'bg-zinc-800 border-zinc-700 scale-110' : 'bg-zinc-950 border-zinc-800'}`}>
                        <FolderOpen size={24} className={isHovering ? "text-indigo-400" : "text-zinc-500"}/>
                    </div>
                    <div>
                        {/* Improved Contrast: zinc-200 -> zinc-100 */}
                        <h3 className="text-lg font-semibold text-zinc-100">Open Database</h3>
                        {/* Improved Contrast: zinc-500 -> zinc-400 */}
                        <p className="text-xs text-zinc-400 mt-1">Select a database file or drag & drop here</p>
                    </div>
                </div>

                {/* Significantly Improved Contrast for Links */}
                <div className="flex gap-6 text-sm font-medium text-zinc-400">
                                <span
                                    className="hover:text-zinc-100 hover:underline cursor-pointer transition-colors decoration-zinc-600 underline-offset-4">
                                    Recent Projects
                                </span>
                    <span className="text-zinc-700">•</span>
                    <span
                        className="hover:text-zinc-100 hover:underline cursor-pointer transition-colors decoration-zinc-600 underline-offset-4">
                                    Documentation
                                </span>
                </div>
            </div>

            {/* Footer */}
            <div className="absolute bottom-4 text-[10px] text-zinc-600 font-mono">
                v0.1.0-alpha • Powered by Rust
            </div>
        </div>
    );
};