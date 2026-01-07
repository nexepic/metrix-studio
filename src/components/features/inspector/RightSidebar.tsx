import React from 'react';
import { useApp } from '@/context/AppStore';
import { Inspector } from './Inspector';
import { HistoryList } from './HistoryList';
import { AnalysisPanel } from './AnalysisPanel';
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup
} from "@/components/ui/resizable";

export const RightSidebar: React.FC = () => {
    const { activeTopPanel, activeBottomPanel } = useApp();

    // Helper to render top content
    const TopContent = () => (
        <>
            {activeTopPanel === 'properties' && <Inspector />}
            {activeTopPanel === 'history' && <HistoryList />}
        </>
    );

    // Helper to render bottom content
    const BottomContent = () => (
        <AnalysisPanel />
    );

    return (
        <div className="h-full w-full bg-transparent flex flex-col">

            {/* CASE 1: Both Panels are Open (Split View) */}
            {activeTopPanel && activeBottomPanel ? (
                <ResizablePanelGroup direction="vertical" autoSaveId="right-sidebar-split">

                    {/* Top Panel */}
                    <ResizablePanel defaultSize={50} minSize={20} className="flex flex-col min-h-0">
                        <TopContent />
                    </ResizablePanel>

                    {/* Draggable Divider */}
                    <ResizableHandle className="bg-transparent hover:bg-indigo-500/50 h-[2px] transition-colors" />

                    {/* Bottom Panel */}
                    <ResizablePanel defaultSize={50} minSize={20} className="flex flex-col min-h-0">
                        <BottomContent />
                    </ResizablePanel>

                </ResizablePanelGroup>
            ) : (
                // CASE 2: Single Panel View (Full Height)
                <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                    {activeTopPanel && <TopContent />}
                    {activeBottomPanel && <BottomContent />}
                </div>
            )}
        </div>
    );
};