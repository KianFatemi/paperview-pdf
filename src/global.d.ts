export interface IElectronAPI {
    openFile: () => Promise<Uint8Array | null>,
  }
  
  declare global {
    interface Window {
      electronAPI: IElectronAPI
    }
  }