import React from 'react';
import { useApp } from '@/context/AppStore';
import { Database, Zap } from 'lucide-react';

export const StatusBar: React.FC = () => {
    const { dbPath, isConnected } = useApp();

    return (
        <div className="h-6 bg-zinc-950 border-t border-zinc-800 flex items-center px-3 justify-between select-none">
            <div className="flex items-center gap-4">
                <div className={`flex items-center gap-1.5 text-[10px] font-medium ${isConnected ? 'text-indigo-400' : 'text-zinc-600'}`}>
                    <Database size={10} />
                    {isConnected ? 'CONNECTED' : 'DISCONNECTED'}
                </div>
                {dbPath && (
                    <span className="text-[10px] text-zinc-500 truncate max-w-[300px]">
                        {dbPath}
                    </span>
                )}
            </div>

            <div className="flex items-center gap-4 text-[10px] text-zinc-600">
                <div className="flex items-center gap-1">
                    <Zap size={10} />
                    <span>Engine Ready</span>
                </div>
                <span>v0.1.0-alpha</span>
            </div>
        </div>
    );
};