import { app, BrowserWindow, ipcMain, dialog, clipboard } from 'electron';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as syncFs from 'fs';
import { fileURLToPath } from 'url';
import { scanDirectory } from './services/scanner.ts';
import type { ScanOptions } from '../src/types/index.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  const iconCandidate = path.join(__dirname, '../public/logo.png');
  const distCandidate = path.join(__dirname, '../dist/logo.png');
  const appIcon = syncFs.existsSync(iconCandidate)
    ? iconCandidate
    : syncFs.existsSync(distCandidate)
      ? distCandidate
      : undefined;

  mainWindow = new BrowserWindow({
    width: 1300,
    height: 850,
    minWidth: 900,
    minHeight: 600,
    title: 'LocalIngest Studio',
    icon: appIcon,
    backgroundColor: '#080511',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(
        __dirname,
        path.extname(__filename) === '.mjs' || syncFs.existsSync(path.join(__dirname, 'preload.mjs'))
          ? 'preload.mjs'
          : 'preload.js'
      ),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
  });

  // Memory optimization on minimize / blur (Bondage Club / WebView2 learned pattern adapted for Electron)
  mainWindow.on('minimize', () => {
    // Trim working set and pause unnecessary background painting
    mainWindow?.webContents.setBackgroundThrottling(true);
  });

  mainWindow.on('restore', () => {
    mainWindow?.webContents.setBackgroundThrottling(false);
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handler: Directory Picker
ipcMain.handle('dialog:selectDirectory', async () => {
  if (!mainWindow) return null;
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
    title: 'Select Project Directory to Ingest',
  });
  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }
  return result.filePaths[0];
});

// IPC Handler: Scan Directory
ipcMain.handle('fs:scanDirectory', async (_event, rootPath: string, options?: ScanOptions) => {
  return await scanDirectory(rootPath, options);
});

// IPC Handler: Read Files Content
ipcMain.handle('fs:readFilesContent', async (_event, filePaths: string[]) => {
  const results: Record<string, string> = {};
  for (const filePath of filePaths) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      results[filePath] = content;
    } catch (err: any) {
      results[filePath] = `[Error reading file: ${err.message}]`;
    }
  }
  return results;
});

// IPC Handler: Save Output File
ipcMain.handle('dialog:saveFile', async (_event, defaultFileName: string, content: string) => {
  if (!mainWindow) return false;
  const result = await dialog.showSaveDialog(mainWindow, {
    title: 'Export Merged Codebase',
    defaultPath: defaultFileName,
    filters: [
      { name: 'Text / XML / Markdown', extensions: ['xml', 'md', 'txt'] },
      { name: 'All Files', extensions: ['*'] },
    ],
  });

  if (result.canceled || !result.filePath) {
    return false;
  }

  await fs.writeFile(result.filePath, content, 'utf-8');
  return true;
});

// IPC Handler: Clipboard
ipcMain.handle('clipboard:write', async (_event, text: string) => {
  clipboard.writeText(text);
});

// IPC Handler: Git Status
ipcMain.handle('git:status', async (_event, rootPath: string) => {
  try {
    const { execFile } = await import('child_process');
    const { promisify } = await import('util');
    const execFileAsync = promisify(execFile);

    const { stdout } = await execFileAsync(
      'git',
      ['status', '--porcelain', '-uall'],
      { cwd: rootPath, timeout: 5000, windowsHide: true }
    );

    const lines = stdout.trim().split('\n').filter(Boolean);
    const changedFiles = lines.map((line) => {
      // porcelain format: 'XY filename' or 'XY orig -> dest'
      const filePart = line.substring(3).trim().replace(/^"|"$/g, '');
      if (filePart.includes('->')) {
        return filePart.split('->').pop()!.trim().replace(/\\/g, '/');
      }
      return filePart.replace(/\\/g, '/');
    });

    return { isGit: true, changedFiles };
  } catch {
    return { isGit: false, changedFiles: [] };
  }
});
