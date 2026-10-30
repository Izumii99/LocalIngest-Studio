import { contextBridge, ipcRenderer } from 'electron';
import type { ElectronAPI, ScanOptions } from '../src/types/index.ts';

const api: ElectronAPI = {
  selectDirectory: (defaultPath?: string) =>
    ipcRenderer.invoke('dialog:selectDirectory', defaultPath),
  scanDirectory: (rootPath: string, options?: ScanOptions) =>
    ipcRenderer.invoke('fs:scanDirectory', rootPath, options),
  readFilesContent: (filePaths: string[]) =>
    ipcRenderer.invoke('fs:readFilesContent', filePaths),
  saveOutputFile: (defaultFileName: string, content: string) =>
    ipcRenderer.invoke('dialog:saveFile', defaultFileName, content),
  saveMultiPartFiles: (baseFileName: string, parts: { fileName: string; content: string }[]) =>
    ipcRenderer.invoke('dialog:saveMultiPartFiles', baseFileName, parts),
  copyToClipboard: (text: string) =>
    ipcRenderer.invoke('clipboard:write', text),
  getGitStatus: (rootPath: string) =>
    ipcRenderer.invoke('git:status', rootPath),
  getPreferences: () =>
    ipcRenderer.invoke('preferences:get'),
  setPreferences: (prefs) =>
    ipcRenderer.invoke('preferences:set', prefs),
};

contextBridge.exposeInMainWorld('electronAPI', api);
