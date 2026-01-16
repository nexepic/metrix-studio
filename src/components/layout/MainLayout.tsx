import React from 'react';
import {useApp} from '@/context/AppStore';
import {LeftActivityBar} from './LeftActivityBar';
import {RightActivityBar} from './RightActivityBar';
import {StatusBar} from './StatusBar';
import {LeftSidebar} from '../features/explorer/LeftSidebar';
import {RightSidebar} from '../features/inspector/RightSidebar';
import {QueryEditor} from '../features/editor/QueryEditor';
import {GraphCanvas} from '../features/graph/GraphCanvas';
import {QueryResultTable} from '../features/graph/QueryResultTable';
import {ResizableHandle, ResizablePanel, ResizablePanelGroup} from "@/components/ui/resizable";
import {Share2, Table as TableIcon, LayoutPanelLeft} from "lucide-react";
import {cn} from "@/lib/utils";

export const MainLayout: React.FC = () => {
    const {
        isLeftSidebarOpen,
        isRightSidebarOpen,
        activeResultView,
        setActiveResultView
    } = useApp();

    return (
        <div className="flex flex-col h-full w-full bg-background overflow-hidden pt-10">
            <div className="flex-1 flex overflow-hidden">
                {/* 1. Left Activity Bar (Navigation) */}
                <LeftActivityBar/>

                {/* 2. Main Resizable Grid */}
                <ResizablePanelGroup direction="horizontal" className="flex-1 bg-background" autoSaveId="metrix-layout">

                    {/* A. Left Sidebar Content (Explorer/Search) */}
                    {isLeftSidebarOpen && (
                        <>
                            <ResizablePanel defaultSize={18} minSize={12} maxSize={25}
                                            className="bg-zinc-950/50 border-r border-border">
                                <LeftSidebar/>
                            </ResizablePanel>
                            <ResizableHandle
                                className="bg-transparent hover:bg-primary/50 w-[1px] transition-colors"/>
                        </>
                    )}

                    {/* B. Center Stage: Editor + Results */}
                    <ResizablePanel defaultSize={60}>
                        <ResizablePanelGroup direction="vertical">

                            {/* Top: Cypher Query Editor */}
                            <ResizablePanel defaultSize={35} minSize={10}
                                            className="border-b border-border bg-zinc-950">
                                <QueryEditor/>
                            </ResizablePanel>

                            <ResizableHandle
                                className="bg-transparent hover:bg-primary/50 h-[1px] transition-colors"/>

                            {/* Bottom: Results Section */}
                            <ResizablePanel defaultSize={65}>
                                <div className="h-full w-full flex flex-col bg-zinc-950 overflow-hidden">

                                    {/*
                                        RESULT TOOLBAR (Professional Placement)
                                        This header sits at the top of the result panel, mirroring the editor toolbar.
                                    */}
                                    <div
                                        className="h-9 flex items-center justify-between px-4 bg-zinc-900/30 border-b border-zinc-800 shrink-0">
                                        <div className="flex items-center gap-4 h-full">
                                            {/* Label */}
                                            <div className="flex items-center gap-2 pr-2 border-r border-zinc-800">
                                                <LayoutPanelLeft size={14} className="text-zinc-500"/>
                                                <span
                                                    className="text-[10px] font-black uppercase tracking-[2px] text-zinc-500">Result</span>
                                            </div>

                                            {/* Integrated View Toggle */}
                                            <div className="flex h-full py-1.5 gap-1">
                                                <ViewTab
                                                    active={activeResultView === 'graph'}
                                                    onClick={() => setActiveResultView('graph')}
                                                    icon={<Share2 size={12}/>}
                                                    label="Graph"
                                                />
                                                <ViewTab
                                                    active={activeResultView === 'table'}
                                                    onClick={() => setActiveResultView('table')}
                                                    icon={<TableIcon size={12}/>}
                                                    label="Table"
                                                />
                                            </div>
                                        </div>

                                        {/* Right-side slot for future actions like 'Export' or 'Clear' */}
                                        <div className="flex items-center gap-2">
                                            {/* Placeholder for future buttons */}
                                        </div>
                                    </div>

                                    {/* CONTENT AREA: Graph or Table */}
                                    <div className="flex-1 min-h-0 relative">
                                        {activeResultView === 'graph' ? (
                                            <GraphCanvas/>
                                        ) : (
                                            <QueryResultTable/>
                                        )}
                                    </div>
                                </div>
                            </ResizablePanel>
                        </ResizablePanelGroup>
                    </ResizablePanel>

                    {/* C. Right Sidebar Content (Inspector/History/Analysis) */}
                    {isRightSidebarOpen && (
                        <>
                            <ResizableHandle
                                className="bg-transparent hover:bg-primary/50 w-[1px] transition-colors"/>
                            <ResizablePanel defaultSize={20} minSize={15} maxSize={30}
                                            className="bg-zinc-950/50 border-l border-border">
                                <RightSidebar/>
                            </ResizablePanel>
                        </>
                    )}

                </ResizablePanelGroup>

                {/* 3. Right Activity Bar (Tools) */}
                <RightActivityBar/>
            </div>

            {/* 4. Status Bar */}
            <StatusBar/>
        </div>
    );
};

/**
 * Internal Helper: Tab-style button for the Integrated Result Toolbar.
 */
interface ViewTabProps {
    active: boolean;
    onClick: () => void;
    icon: React.ReactNode;
    label: string;
}

const ViewTab: React.FC<ViewTabProps> = ({active, onClick, icon, label}) => (
    <button
        onClick={onClick}
        className={cn(
            "flex items-center gap-2 px-3 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all h-full",
            active
                ? "bg-indigo-600/10 text-indigo-400 border border-indigo-500/20"
                : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5 border border-transparent"
        )}
    >
        <span className={cn(active ? "text-indigo-400" : "text-zinc-500")}>
            {icon}
        </span>
        <span>{label}</span>
    </button>
);