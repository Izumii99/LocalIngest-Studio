import { app, BrowserWindow, ipcMain, dialog, clipboard } from 'electron';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as syncFs from 'fs';
import { fileURLToPath } from 'url';
import { scanDirectory } from './services/scanner.ts';
import type { ScanOptions, AppPreferences } from '../src/types/index.ts';

app.name = 'LocalIngest-Studio';

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

// Preferences Storage Helper
function getPreferencesFilePath(): string {
  if (process.env.PORTABLE_EXECUTABLE_DIR) {
    const portablePath = path.join(process.env.PORTABLE_EXECUTABLE_DIR, '.localingest-config.json');
    try {
      syncFs.accessSync(process.env.PORTABLE_EXECUTABLE_DIR, syncFs.constants.W_OK);
      return portablePath;
    } catch {
      // Directory is not writable, fallback to standard userData
    }
  }

  const userDataDir = app.getPath('userData');
  if (!syncFs.existsSync(userDataDir)) {
    try {
      syncFs.mkdirSync(userDataDir, { recursive: true });
    } catch {}
  }
  return path.join(userDataDir, 'preferences.json');
}

async function loadPreferences(): Promise<AppPreferences> {
  const primaryPath = getPreferencesFilePath();
  const fallbackPath = path.join(app.getPath('userData'), 'preferences.json');
  const candidates = Array.from(new Set([primaryPath, fallbackPath]));

  for (const targetPath of candidates) {
    try {
      if (syncFs.existsSync(targetPath)) {
        const raw = await fs.readFile(targetPath, 'utf-8');
        const parsed = JSON.parse(raw);
        return {
          recentFolders: Array.isArray(parsed.recentFolders) ? parsed.recentFolders : [],
          maxFileSizeKB:
            typeof parsed.maxFileSizeKB === 'number' && parsed.maxFileSizeKB > 0
              ? parsed.maxFileSizeKB
              : 100,
        };
      }
    } catch {
      // Continue to next candidate
    }
  }

  return {
    recentFolders: [],
    maxFileSizeKB: 100,
  };
}

async function savePreferences(prefs: Partial<AppPreferences>): Promise<AppPreferences> {
  const current = await loadPreferences();
  const updated: AppPreferences = {
    recentFolders: Array.isArray(prefs.recentFolders) ? prefs.recentFolders : current.recentFolders,
    maxFileSizeKB:
      typeof prefs.maxFileSizeKB === 'number' && prefs.maxFileSizeKB > 0
        ? prefs.maxFileSizeKB
        : current.maxFileSizeKB,
  };

  const targetPath = getPreferencesFilePath();
  try {
    const dir = path.dirname(targetPath);
    if (!syncFs.existsSync(dir)) {
      syncFs.mkdirSync(dir, { recursive: true });
    }
    await fs.writeFile(targetPath, JSON.stringify(updated, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save preferences to primary target:', err);
    try {
      const fallbackDir = app.getPath('userData');
      if (!syncFs.existsSync(fallbackDir)) {
        syncFs.mkdirSync(fallbackDir, { recursive: true });
      }
      await fs.writeFile(path.join(fallbackDir, 'preferences.json'), JSON.stringify(updated, null, 2), 'utf-8');
    } catch (fallbackErr) {
      console.error('Failed to save preferences to fallback target:', fallbackErr);
    }
  }

  return updated;
}

// IPC Handlers: Preferences
ipcMain.handle('preferences:get', async () => {
  return await loadPreferences();
});

ipcMain.handle('preferences:set', async (_event, prefs: Partial<AppPreferences>) => {
  return await savePreferences(prefs);
});

