export type CheckState = 'checked' | 'unchecked' | 'indeterminate';

export type OutputFormat = 'xml' | 'markdown' | 'plain';

export interface FileNode {
  id: string;
  name: string;
  path: string;
  relativePath: string;
  isDirectory: boolean;
  size?: number;
  children?: FileNode[];
  isBinary?: boolean;
  isIgnored?: boolean;
}

export interface ScanOptions {
  customIgnoreRules?: string[];
  respectGitignore?: boolean;
  maxFileSizeKB?: number;
}

export interface GitStatusResult {
  isGit: boolean;
  changedFiles: string[];
}

export interface SecretFinding {
  filePath: string;
  type: string;
  matchSnippet: string;
  line: number;
}

export interface IngestStats {
  totalFiles: number;
  selectedFiles: number;
  totalSizeBytes: number;
  selectedSizeBytes: number;
  estimatedTokens: number;
}

export interface IngestConfig {
  format: OutputFormat;
  includeAsciiTree: boolean;
  includeStats: boolean;
  maxFileSizeKB: number;
  redactSecrets: boolean;
}

export interface AppPreferences {
  recentFolders: string[];
  maxFileSizeKB: number;
}

export interface ElectronAPI {
  selectDirectory: () => Promise<string | null>;
  scanDirectory: (rootPath: string, options?: ScanOptions) => Promise<FileNode>;
  readFilesContent: (filePaths: string[]) => Promise<Record<string, string>>;
  saveOutputFile: (defaultFileName: string, content: string) => Promise<boolean>;
  copyToClipboard: (text: string) => Promise<void>;
  getGitStatus: (rootPath: string) => Promise<GitStatusResult>;
  getPreferences: () => Promise<AppPreferences>;
  setPreferences: (prefs: Partial<AppPreferences>) => Promise<AppPreferences>;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
