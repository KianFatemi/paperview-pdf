import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  openFile: () => ipcRenderer.invoke('dialog:openFile'),
  saveFile: (pdfData: Uint8Array, defaultFilename?: string) => 
    ipcRenderer.invoke('dialog:saveFile', pdfData, defaultFilename),
  onMenuOpenPdf: (callback: () => void) => {
    ipcRenderer.on('menu:open-pdf', callback);
    return () => ipcRenderer.removeListener('menu:open-pdf', callback);
  },
  onMenuExportPdf: (callback: () => void) => {
    ipcRenderer.on('menu:export-pdf', callback);
    return () => ipcRenderer.removeListener('menu:export-pdf', callback);
  }
});