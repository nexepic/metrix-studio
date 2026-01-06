import {defineConfig} from "vite";
import react from "@vitejs/plugin-react";
import {resolve} from "path";
import tailwindcss from "@tailwindcss/vite";

const host = process.env.TAURI_DEV_HOST;

// https://vite.dev/config/
export default defineConfig(async () => ({
    plugins: [
        react(),
        tailwindcss(),
    ],

    // --- Path Alias Configuration ---
    resolve: {
        alias: {
            // Maps "@" to the "src" directory
            // resolve(__dirname, "src") is also common, but process.cwd() is safe in most Vite contexts
            "@": resolve(process.cwd(), "src"),
        },
    },

    // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
    //
    // 1. prevent Vite from obscuring rust errors
    clearScreen: false,
    // 2. tauri expects a fixed port, fail if that port is not available
    server: {
        port: 1420,
        strictPort: true,
        host: host || false,
        hmr: host
            ? {
                protocol: "ws",
                host,
                port: 1421,
            }
            : undefined,
        watch: {
            // 3. tell Vite to ignore watching `src-tauri`
            ignored: ["**/src-tauri/**"],
        },
    },
}));