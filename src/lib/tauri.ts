import { getCurrentWindow } from '@tauri-apps/api/window';
// For Tauri v1, this might be '@tauri-apps/api/dialog'.
// For Tauri v2, it is usually via plugin.
// We assume standard v2 plugin usage here:
import { open as openDialog } from '@tauri-apps/plugin-dialog';

// Wrapper for the window instance
export const appWindow = getCurrentWindow();

export const dialog = {
    open: openDialog
};