import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url'; 
import fs from 'node:fs/promises';


const __filename = fileURLToPath(import.meta.url); 
const __dirname = path.dirname(__filename); 


process.env.DIST = path.join(__dirname, '../dist'); 
process.env.VITE_PUBLIC = app.isPackaged ? process.env.DIST : path.join(process.env.DIST, '../public');

let win: BrowserWindow | null;

const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'];

function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC ?? '', 'electron-vite.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'), 
    },
  });

  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString());
  });

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(process.env.DIST ?? '', 'index.html'));
  }
}

ipcMain.handle('dialog:openFile', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'PDFs', extensions: ['pdf'] }]
  });
  if (!canceled && filePaths.length > 0) {
    const filePath = filePaths[0];
    const fileData = await fs.readFile(filePath);
    return new Uint8Array(fileData);
  }
  return null;
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
    win = null;
  }
});

app.whenReady().then(createWindow);