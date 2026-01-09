import { invoke } from '@tauri-apps/api/core';
import { QueryResult } from '@/types';

export const DatabaseApi = {
    /**
     * Connect to a local database.
     * @param path Full path to the database folder/file
     */
    async create(path: string): Promise<string> {
        try {
            return await invoke<string>("open_database", { path });
        } catch (e) {
            console.error("Failed to connect to database:", e);
            throw e;
        }
    },

    async connectExisting(path: string): Promise<string> {
        try {
            return await invoke<string>("connect_existing", {path});
        } catch (e) {
            console.error("Failed to connect to existing database:", e);
            throw e;
        }
    },

    /**
     * Close the current database connection.
     */
    async disconnect(): Promise<void> {
        try {
            await invoke("close_database");
        } catch (e) {
            console.error("Failed to disconnect:", e);
        }
    },

    /**
     * Execute a Cypher query.
     * @param cypher The query string
     */
    async query(cypher: string): Promise<QueryResult> {
        try {
            return await invoke<QueryResult>("run_query", { query: cypher });
        } catch (e) {
            console.error("Query Execution Failed:", e);
            throw e;
        }
    }
};