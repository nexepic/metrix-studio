import { invoke } from '@tauri-apps/api/core';
import { QueryResult } from '@/types';

export const DatabaseApi = {
    async connect(path: string): Promise<void> {
        try {
            await invoke("open_database", { path });
        } catch (e) {
            console.error("API Connect Error:", e);
            throw e;
        }
    },

    async disconnect(): Promise<void> {
        try {
            await invoke("close_database");
        } catch (e) {
            console.error("API Disconnect Error:", e);
        }
    },

    async query(cypher: string): Promise<QueryResult> {
        try {
            return await invoke<QueryResult>("run_query", { query: cypher });
        } catch (e) {
            console.error("API Query Error:", e);
            throw e;
        }
    }
};