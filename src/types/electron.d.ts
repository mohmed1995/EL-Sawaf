declare module 'electron' {
  export const ipcMain: {
    handle(channel: string, listener: (event: any, ...args: any[]) => any): void;
    removeHandler(channel: string): void;
  };
  export const ipcRenderer: {
    invoke(channel: string, ...args: any[]): Promise<any>;
    on(channel: string, listener: (event: any, ...args: any[]) => void): void;
  };
  export const contextBridge: {
    exposeInMainWorld(apiKey: string, api: any): void;
  };
}
