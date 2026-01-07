import {useState, useEffect} from "react";
import {open} from "@tauri-apps/plugin-dialog";
import {listen} from "@tauri-apps/api/event";
import {Cpu, FolderOpen} from "lucide-react";
import {useApp} from "@/context/AppStore";

export const WelcomeScreen = () => {
    const {connectDatabase} = useApp();
    const [isHovering, setIsHovering] = useState(false);

    // Drag & Drop Listener for the specific Welcome Screen context
    useEffect(() => {
        const unlistenPromise = listen<string[]>('tauri://file-drop', async (event) => {
            const files = event.payload;
            if (files && files.length > 0) connectDatabase(files[0]);
        });
        return () => {
            unlistenPromise.then(unlisten => unlisten());
        };
    }, []);

    const handleOpen = async () => {
        try {
            const selected = await open({
                multiple: false,
                filters: [{name: 'MetrixDB', extensions: ['mx', 'db', 'bin']}]
            });
            if (typeof selected === 'string') connectDatabase(selected);
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div
            className="h-full w-full flex flex-col items-center justify-center bg-[#09090b] text-zinc-100 relative overflow-hidden select-none">
            {/* Ambient Background */}
            <div
                className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-900/20 rounded-full blur-[120px] pointer-events-none"/>
            <div
                className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-900/10 rounded-full blur-[120px] pointer-events-none"/>

            {/* Content Card */}
            <div className="z-10 flex flex-col items-center gap-8 animate-in fade-in zoom-in duration-700">
                <div className="flex flex-col items-center gap-4">
                    <div className="p-4 bg-zinc-900/50 rounded-2xl border border-zinc-800 shadow-2xl">
                        <Cpu size={48} className="text-indigo-500"/>
                    </div>
                    <div className="text-center">
                        <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-br from-white via-zinc-300 to-zinc-500 bg-clip-text text-transparent">
                            Metrix Studio
                        </h1>
                        <p className="text-zinc-500 mt-2 text-sm font-medium tracking-wide">
                            High-Performance Graph Engine Client
                        </p>
                    </div>
                </div>

                <div
                    onClick={handleOpen}
                    onMouseEnter={() => setIsHovering(true)}
                    onMouseLeave={() => setIsHovering(false)}
                    className={`
                        cursor-pointer group relative w-[380px] p-8 rounded-xl border transition-all duration-300
                        flex flex-col items-center gap-4 text-center
                        ${isHovering
                        ? 'bg-zinc-900/80 border-indigo-500/50 shadow-[0_0_40px_-10px_rgba(99,102,241,0.3)]'
                        : 'bg-zinc-900/30 border-zinc-800'}
                    `}
                >
                    <div
                        className="p-3 bg-zinc-950 rounded-full border border-zinc-800 group-hover:scale-110 transition-transform duration-300">
                        <FolderOpen size={24} className={isHovering ? "text-indigo-400" : "text-zinc-600"}/>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-zinc-200">Open Database</h3>
                        <p className="text-xs text-zinc-500 mt-1">Select a database folder or drag & drop here</p>
                    </div>
                </div>

                <div className="flex gap-4 text-xs text-zinc-600">
                    <span className="hover:text-zinc-400 cursor-pointer transition-colors">Recent</span>
                    <span>•</span>
                    <span className="hover:text-zinc-400 cursor-pointer transition-colors">Documentation</span>
                </div>
            </div>

            {/* Footer */}
            <div className="absolute bottom-4 text-[10px] text-zinc-700 font-mono">
                v0.1.0-alpha • Powered by Rust
            </div>
        </div>
    );
};