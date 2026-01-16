import React from 'react';
import {useApp} from '@/context/AppStore';
import {ScrollArea, ScrollBar} from "@/components/ui/scroll-area";
import {
    Table, TableBody, TableCell,
    TableHead, TableHeader, TableRow
} from "@/components/ui/table";

export const QueryResultTable: React.FC = () => {
    const {queryResultMetadata} = useApp();
    const {columns, rows} = queryResultMetadata;

    if (rows.length === 0) {
        return (
            <div className="flex items-center justify-center h-full text-zinc-600 text-xs italic">
                No rows returned.
            </div>
        );
    }

    return (
        <div className="h-full w-full bg-zinc-950 flex flex-col overflow-hidden">
            <ScrollArea className="flex-1">
                <Table>
                    <TableHeader className="bg-zinc-900/50 sticky top-0 z-10 backdrop-blur-md">
                        <TableRow className="hover:bg-transparent border-zinc-800">
                            {columns.map((col, i) => (
                                <TableHead key={i}
                                           className="text-[10px] font-black uppercase tracking-[2px] text-zinc-500 h-10 px-4">
                                    {col}
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rows.map((row, rowIndex) => (
                            <TableRow key={rowIndex}
                                      className="border-zinc-900 hover:bg-white/[0.02] transition-colors group">
                                {row.map((cell, cellIndex) => (
                                    <TableCell key={cellIndex}
                                               className="px-4 py-2 font-mono text-[12px] text-zinc-300 whitespace-nowrap">
                                        {formatCellValue(cell)}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                <ScrollBar orientation="horizontal"/>
            </ScrollArea>

            {/* Table Footer / Summary */}
            <div
                className="px-4 py-2 bg-zinc-900/30 border-t border-zinc-800 flex items-center justify-between text-[10px] text-zinc-500 font-medium">
                <span>Displaying {rows.length} rows</span>
                <span className="font-mono uppercase opacity-50">Raw Result Set</span>
            </div>
        </div>
    );
};

// Helper to format different JSON values for the table
const formatCellValue = (val: any) => {
    if (val === null) return <span className="text-zinc-700 italic">null</span>;
    if (typeof val === 'boolean') return <span
        className={val ? "text-emerald-500" : "text-red-500"}>{val.toString()}</span>;
    if (typeof val === 'object') return <code className="text-indigo-400 text-[10px]">{JSON.stringify(val)}</code>;
    return val.toString();
};