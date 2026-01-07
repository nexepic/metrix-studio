import React from 'react';
import {useApp} from '@/context/AppStore';
import {LeftActivityBar} from './LeftActivityBar'; // Your existing component
import {RightActivityBar} from './RightActivityBar'; // New component
import {StatusBar} from './StatusBar';
import {LeftSidebar} from '../features/explorer/LeftSidebar';
import {RightSidebar} from '../features/inspector/RightSidebar';
import {QueryEditor} from '../features/editor/QueryEditor';
import {GraphCanvas} from '../features/graph/GraphCanvas';
import {ResizableHandle, ResizablePanel, ResizablePanelGroup} from "@/components/ui/resizable";

export const MainLayout: React.FC = () => {
    const {isLeftSidebarOpen, isRightSidebarOpen} = useApp();

    return (
        <div className="flex flex-col h-screen w-screen bg-[#09090b] text-foreground overflow-hidden">
            <div className="flex-1 flex overflow-hidden">
                {/* 2. Left Activity Bar */}
                <LeftActivityBar/>

                {/* 3. Main Resizable Grid */}
                <ResizablePanelGroup direction="horizontal" className="flex-1 bg-background" autoSaveId="metrix-layout">

                    {/* A. Left Sidebar Content */}
                    {isLeftSidebarOpen && (
                        <>
                            <ResizablePanel defaultSize={18} minSize={12} maxSize={25}
                                            className="bg-zinc-950/50 border-r border-border">
                                <LeftSidebar/>
                            </ResizablePanel>
                            <ResizableHandle
                                className="bg-transparent hover:bg-indigo-500/50 w-[1px] transition-colors"/>
                        </>
                    )}

                    {/* B. Center Stage */}
                    <ResizablePanel defaultSize={60}>
                        <ResizablePanelGroup direction="vertical">
                            <ResizablePanel defaultSize={35} minSize={10}
                                            className="border-b border-border bg-zinc-950">
                                <QueryEditor/>
                            </ResizablePanel>
                            <ResizableHandle
                                className="bg-transparent hover:bg-indigo-500/50 h-[1px] transition-colors"/>
                            <ResizablePanel defaultSize={65}>
                                <GraphCanvas/>
                            </ResizablePanel>
                        </ResizablePanelGroup>
                    </ResizablePanel>

                    {/* C. Right Sidebar Content */}
                    {isRightSidebarOpen && (
                        <>
                            <ResizableHandle
                                className="bg-transparent hover:bg-indigo-500/50 w-[1px] transition-colors"/>
                            <ResizablePanel defaultSize={20} minSize={15} maxSize={30}
                                            className="bg-zinc-950/50 border-l border-border">
                                <RightSidebar/>
                                {/* Note: RightSidebar doesn't need tabs inside anymore,
                                    it should just render the content based on activeRightTab */}
                            </ResizablePanel>
                        </>
                    )}

                </ResizablePanelGroup>

                {/* 4. Right Activity Bar */}
                <RightActivityBar/>
            </div>

            {/* 5. Status Bar */}
            <StatusBar/>
        </div>
    );
};