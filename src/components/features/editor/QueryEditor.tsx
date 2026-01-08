import {useApp} from '@/context/AppStore';
import {Play, Eraser} from 'lucide-react';

export const QueryEditor = () => {
    const {query, setQuery, runQuery, isConnected} = useApp();

    return (
        <div className="flex flex-col h-full bg-background">
            <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/20">
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary/50"></span>
                    <span className="text-xs font-medium text-muted-foreground">CYPHER EDITOR</span>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setQuery('')}
                        className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
                        title="Clear"
                    >
                        <Eraser size={14}/>
                    </button>
                    <button
                        // Wrapped in arrow function to avoid passing Event object as query string
                        onClick={() => runQuery()}
                        disabled={!isConnected}
                        className="flex items-center gap-2 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground px-3 py-1.5 rounded-md text-xs font-medium transition-all shadow-sm"
                    >
                        <Play size={12} fill="currentColor"/> Run Query
                    </button>
                </div>
            </div>

            <div className="flex-1 relative group">
                <textarea
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    // Wrapped here too for consistency
                    onKeyDown={(e) => {
                        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                            e.preventDefault();
                            runQuery();
                        }
                    }}
                    className="w-full h-full bg-background p-4 font-mono text-sm text-foreground resize-none focus:outline-none placeholder:text-muted-foreground/40 leading-relaxed selection:bg-primary/20"
                    placeholder="// Enter your Cypher query here..."
                    spellCheck={false}
                />
                {!isConnected && (
                    <div
                        className="absolute inset-0 bg-background/50 backdrop-blur-[1px] flex items-center justify-center pointer-events-none">
                        <span className="text-sm text-muted-foreground bg-muted px-4 py-2 rounded-full border">Connect to a database to start</span>
                    </div>
                )}
            </div>
        </div>
    );
};