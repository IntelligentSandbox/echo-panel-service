import { app, BrowserWindow, Menu } from "electron";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { watch } from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));

function createWindow() {
    const win = new BrowserWindow({
        width: 350,
        height: 520,
        resizable: true,
        alwaysOnTop: true,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
        },
    });

    win.loadFile(join(__dirname, "src/index.html"));

    watch(join(__dirname, "src"), { recursive: true }, () => {
        win.webContents.reload();
    });
}

app.whenReady().then(() => {
    Menu.setApplicationMenu(null);
    createWindow();
});

app.on("window-all-closed", () => app.quit());
