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
                    extensions: ['mx', 'db', 'bin']
                }]
            });

            if (selected && typeof selected === 'string') {
                console.log("[System] Attempting to open:", selected);

                try {
                    // 1. Await the connection
                    await connectDatabase(selected);

                    // 2. Success! (State update in store triggers navigation)
                    return true;

                } catch (err: any) {
                    // 3. Connection Failed - Show Error to User
                    // Replace this with your UI Toast library if available
                    console.error("Database Open Error:", err);
                    alert(`Failed to open database:\n${err}`);
                    return false;
                }
            }
            return false;
        } catch (e) {
            console.error("[System] Dialog Error:", e);
            return false;
        }
    };

    return {
        openDatabaseDialog,
        disconnectDatabase
    };
};