export interface IElectronAPI {
    openFile: () => Promise<Uint8Array | null>,
    saveFile: (pdfData: Uint8Array, defaultFilename?: string) => Promise<boolean>,
    onMenuOpenPdf: (callback: () => void) => () => void,
    onMenuExportPdf: (callback: () => void) => () => void,
  }
  
  declare global {
    interface Window {
      electronAPI: IElectronAPI
    }
  }