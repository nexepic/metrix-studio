import {open} from '@tauri-apps/plugin-dialog';
import {useApp} from '@/context/AppStore';

export const useDatabaseActions = () => {
    const {connectDatabase, disconnectDatabase} = useApp();

    /**
     * Opens the native system file dialog to select a database file.
     * Handles errors and connects automatically on success.
     */
    const openDatabaseDialog = async () => {
        try {
            const selected = await open({
                multiple: false,
                filters: [{
                    name: 'Metrix Database Files',
                    // Add all valid extensions here
                    extensions: ['mx', 'db', 'bin']
                }]
            });

            if (selected) {
                console.log("[System] Opening database:", selected);
                await connectDatabase(selected);
                return true;
            }
            return false;
        } catch (e) {
            console.error("[System] Failed to open dialog:", e);
            return false;
        }
    };

    return {
        openDatabaseDialog,
        disconnectDatabase
    };
};