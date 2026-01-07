import React from 'react';
import {useApp} from '@/context/AppStore';
import {ScrollArea} from "@/components/ui/scroll-area";
import {Badge} from "@/components/ui/badge";
import {Cuboid, Network, Hash} from "lucide-react";

export const Inspector: React.FC = () => {
    const {selectedElement, selectionType} = useApp();

    if (!selectedElement) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-zinc-500 p-6 text-center">
                <Cuboid size={32} className="mb-3 opacity-20"/>
                <p className="text-xs">Select an element to view details.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b border-zinc-800 bg-zinc-900/20">
                <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline"
                           className="text-[10px] uppercase tracking-wider h-5 px-1.5 border-zinc-700 text-zinc-400">
                        {selectionType}
                    </Badge>
                    <span className="font-mono text-[10px] text-zinc-500 flex items-center gap-1">
                        <Hash size={10}/> {selectedElement.id}
                    </span>
                </div>
                {/* Main Label: High contrast (zinc-100) */}
                <h2 className="text-lg font-bold text-zinc-100 break-all leading-tight tracking-tight">
                    {selectedElement.label}
                </h2>
            </div>

            {/* Properties List */}
            <ScrollArea className="flex-1">
                <div className="p-4 space-y-5">
                    <div
                        className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                        <Network size={12}/> Properties
                    </div>

                    <div className="grid gap-3">
                        {Object.entries(selectedElement.properties).map(([key, value]) => (
                            <div key={key} className="group">
                                {/* Keys: Indigo-300 for distinctness */}
                                <label className="text-[11px] font-medium text-indigo-300/80 mb-1 block font-mono">
                                    {key}
                                </label>
                                {/* Values: Zinc-200 (Bright) inside a box */}
                                <div
                                    className="text-xs bg-zinc-900/40 border border-zinc-800 rounded p-2 text-zinc-200 font-mono break-all group-hover:border-zinc-700 transition-colors selection:bg-indigo-500/30">
                                    {JSON.stringify(value).replace(/^"|"$/g, '')}
                                </div>
                            </div>
                        ))}
                        {Object.keys(selectedElement.properties).length === 0 && (
                            <span className="text-xs text-zinc-500 italic">No properties defined.</span>
                        )}
                    </div>
                </div>
            </ScrollArea>
        </div>
    );
};