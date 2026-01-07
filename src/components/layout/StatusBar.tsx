import React from 'react';
import { useApp } from '@/context/AppStore';
import { Database, Zap, PlugZap, XCircle } from 'lucide-react';
import { useDatabaseActions } from '@/hooks/useDatabaseActions';

export const StatusBar: React.FC = () => {
    const { dbPath, isConnected } = useApp();
    const { disconnectDatabase } = useDatabaseActions();

    return (
        <div className="h-7 bg-zinc-950 border-t border-zinc-800 flex items-center px-3 justify-between select-none z-50">
            {/* Left: Connection Info */}
            <div className="flex items-center gap-4">
                {isConnected ? (
                    <div className="flex items-center gap-2 group">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-400">
                            <PlugZap size={10} />
                            <span>CONNECTED</span>
                        </div>

                        {/* Database Path with Disconnect Action */}
                        <div
                            className="flex items-center gap-2 px-2 py-0.5 rounded hover:bg-zinc-900 transition-colors cursor-pointer group/path"
                            onClick={disconnectDatabase}
                            title="Click to Disconnect"
                        >
                            <span className="text-[10px] text-zinc-400 font-mono truncate max-w-[300px]">
                                {dbPath}
                            </span>
                            <XCircle size={10} className="text-red-500 opacity-0 group-hover/path:opacity-100 transition-opacity" />
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center gap-1.5 text-[10px] font-medium text-zinc-600">
                        <Database size={10} />
                        <span>NO CONNECTION</span>
                    </div>
                )}
            </div>

            {/* Right: System Info */}
            <div className="flex items-center gap-4 text-[10px] text-zinc-600">
                <div className="flex items-center gap-1">
                    <Zap size={10} />
                    <span>Engine Ready</span>
                </div>
                <span className="font-mono opacity-50">v0.1.0</span>
            </div>
        </div>
    );
};