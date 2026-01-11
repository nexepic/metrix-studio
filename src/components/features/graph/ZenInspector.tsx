import React, {useState} from 'react';
import {useApp} from '@/context/AppStore';
import {
    X, Hash, ChevronDown, ChevronUp,
    Layers, Terminal
} from 'lucide-react';
import * as CollapsiblePrimitive from "@radix-ui/react-collapsible";
import {Button} from "@/components/ui/button";
import {ScrollArea} from "@/components/ui/scroll-area";
import {cn} from "@/lib/utils";

export const ZenInspector: React.FC = () => {
    const {selectedElement, selectionType, setSelection} = useApp();
    const [isOpen, setIsOpen] = useState(true);

    if (!selectedElement) return null;

    return (
        <div
            className="absolute bottom-6 left-6 z-[110] pointer-events-auto animate-in fade-in slide-in-from-bottom-4 duration-500"
        >
            <CollapsiblePrimitive.Root
                open={isOpen}
                onOpenChange={setIsOpen}
                className="w-80 bg-zinc-950/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
            >
                {/* Header: Fixed height for consistent layout */}
                <div className="h-16 flex items-center px-4 bg-white/5 border-b border-white/5 shrink-0">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="p-2 bg-indigo-500/20 rounded-xl text-indigo-400 shrink-0">
                            <Layers size={16}/>
                        </div>

                        <div className="flex flex-col min-w-0 justify-center h-full">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 leading-none mb-1.5 select-none">
                                {selectionType}
                            </p>
                            <h3 className="text-sm font-bold text-zinc-100 truncate leading-none tracking-tight">
                                {selectedElement.label}
                            </h3>
                        </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                        <CollapsiblePrimitive.Trigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/10 text-zinc-400">
                                {isOpen ? <ChevronDown size={16}/> : <ChevronUp size={16}/>}
                            </Button>
                        </CollapsiblePrimitive.Trigger>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-red-500/20 text-zinc-400 hover:text-red-400"
                            onClick={() => setSelection(null, null)}
                        >
                            <X size={16}/>
                        </Button>
                    </div>
                </div>

                {/*
                                                            Content wrapper using CSS Grid for smooth height animation.
                                                            This is the most performant and reliable approach for animating
                                                            height from 0 to auto.
                                                        */}
                <CollapsiblePrimitive.Content
                    forceMount
                    className={cn(
                        "grid transition-all duration-500 ease-out",
                        isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                    )}
                >
                    {/* Inner wrapper must have overflow-hidden for grid animation to work */}
                    <div className="overflow-hidden">
                        <ScrollArea className="h-[400px]">
                            <div className="p-5 space-y-6">
                                {/* Identity Row with hover highlight effect */}
                                <div
                                    className="flex items-center justify-between group p-2 -m-2 rounded-xl hover:bg-white/5 transition-colors duration-200">
                                    <div className="flex items-center gap-2">
                                        <Hash size={12}
                                              className="text-zinc-600 group-hover:text-indigo-400 transition-colors"/>
                                        <span
                                            className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-none group-hover:text-zinc-400 transition-colors">
                                                                                    UUID
                                                                                </span>
                                    </div>
                                    <code
                                        className="text-[10px] font-mono text-zinc-400 bg-white/5 px-2 py-1 rounded border border-white/5 tabular-nums group-hover:bg-white/10 group-hover:border-white/10 transition-colors">
                                        {selectedElement.id}
                                    </code>
                                </div>

                                <div className="h-px bg-gradient-to-r from-white/10 via-white/5 to-transparent w-full"/>

                                {/* Dynamic Properties with hover highlight effect */}
                                <div className="space-y-3">
                                    {Object.entries(selectedElement.properties).map(([key, value]) => (
                                        <div
                                            key={key}
                                            className="flex flex-col gap-2 group p-3 -mx-3 rounded-xl hover:bg-white/5 transition-all duration-200"
                                        >
                                            <div className="flex items-center gap-2">
                                                <Terminal size={10}
                                                          className="text-indigo-500/50 group-hover:text-indigo-400 transition-colors"/>
                                                <span
                                                    className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider leading-none group-hover:text-zinc-300 transition-colors">
                                                                                            {key}
                                                                                        </span>
                                            </div>
                                            <div
                                                className="text-[12px] bg-zinc-900/50 border border-white/5 rounded-xl p-3 text-zinc-300 font-mono break-all leading-relaxed selection:bg-indigo-500/30 group-hover:border-indigo-500/30 group-hover:bg-zinc-900/80 transition-all duration-200">
                                                {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                            </div>
                                        </div>
                                    ))}

                                    {Object.keys(selectedElement.properties).length === 0 && (
                                        <div
                                            className="py-10 text-center border border-dashed border-white/10 rounded-2xl hover:border-white/20 transition-colors">
                                            <p className="text-[10px] text-zinc-600 font-medium italic">
                                                No metadata available
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </ScrollArea>

                        {/* Visual bottom fade */}
                        <div
                            className="h-4 bg-gradient-to-t from-black/20 to-transparent shrink-0 pointer-events-none"/>
                    </div>
                </CollapsiblePrimitive.Content>
            </CollapsiblePrimitive.Root>
        </div>
    );
};