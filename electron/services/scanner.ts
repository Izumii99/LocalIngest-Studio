import * as fs from 'fs/promises';
import * as path from 'path';
import ignore, { type Ignore } from 'ignore';
import type { FileNode, ScanOptions } from '../../src/types/index.ts';

// Default folders to ignore
export const DEFAULT_IGNORE_DIRS = [
  'node_modules',
  '.git',
  'dist',
  'build',
  '.next',
  '.nuxt',
  'vendor',
  '.turbo',
  '.cache',
  'coverage',
  '.idea',
  '.vscode',
  '__pycache__',
  '.output',
  'out',
];

// Default file patterns to ignore
export const DEFAULT_IGNORE_PATTERNS = [
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
  'bun.lockb',
  '.env',
  '.env.*',
  '.DS_Store',
  'Thumbs.db',
];

// Common binary file extensions
export const BINARY_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.ico', '.webp', '.svg',
  '.mp4', '.mkv', '.avi', '.mov', '.mp3', '.wav', '.ogg',
  '.zip', '.tar', '.gz', '.7z', '.rar',
  '.pdf', '.epub', '.docx', '.xlsx', '.pptx',
  '.exe', '.dll', '.so', '.dylib', '.bin', '.iso',
  '.woff', '.woff2', '.ttf', '.eot', '.otf',
  '.db', '.sqlite', '.sqlite3', '.class', '.pyc',
]);

/**
 * Checks if a file is likely binary by extension or by scanning initial chunk for null bytes.
 * ponytail: extension check first for O(1) fast path, initial 512 bytes read only for ambiguous files.
 */
export async function isBinaryFile(filePath: string): Promise<boolean> {
  const ext = path.extname(filePath).toLowerCase();
  if (BINARY_EXTENSIONS.has(ext)) {
    return true;
  }

  try {
    const handle = await fs.open(filePath, 'r');
    const buffer = Buffer.alloc(512);
    const { bytesRead } = await handle.read(buffer, 0, 512, 0);
    await handle.close();

    for (let i = 0; i < bytesRead; i++) {
      if (buffer[i] === 0) {
        return true;
      }
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Recursively scans directory and builds a FileNode tree.
 * Respects .gitignore and customizable ignore patterns.
 */
export async function scanDirectory(
  rootDir: string,
  options: ScanOptions = {}
): Promise<FileNode> {
  // Validate and sanitize root directory to guard against path traversal
  if (!rootDir || typeof rootDir !== 'string') {
    throw new Error('Invalid directory path specified');
  }
  const rawRoot = path.isAbsolute(rootDir) ? rootDir : `${process.cwd()}/${rootDir}`;
  const normalizedRoot = path.normalize(rawRoot);
  const ig: Ignore = ignore();

  // Add default rules
  ig.add(DEFAULT_IGNORE_DIRS.map((dir) => `${dir}/`));
  ig.add(DEFAULT_IGNORE_PATTERNS);

  // Add custom user ignore rules
  if (options.customIgnoreRules && options.customIgnoreRules.length > 0) {
    ig.add(options.customIgnoreRules);
  }

  // Load root .gitignore if present and requested
  if (options.respectGitignore !== false) {
    const rootGitignorePath = path.normalize(`${normalizedRoot}/.gitignore`);
    if (rootGitignorePath.startsWith(normalizedRoot)) {
      try {
        const gitignoreContent = await fs.readFile(rootGitignorePath, 'utf8');
        ig.add(gitignoreContent);
      } catch {
        // No .gitignore found, continue safely
      }
    }
  }

  async function walk(currentPath: string, relPath: string): Promise<FileNode | null> {
    const stats = await fs.stat(currentPath);
    const isDirectory = stats.isDirectory();
    const baseName = path.basename(currentPath);

    // Normalize relative path with forward slashes for 'ignore' matching
    const forwardSlashRel = relPath.replace(/\\/g, '/');

    if (relPath !== '') {
      const testPath = isDirectory ? `${forwardSlashRel}/` : forwardSlashRel;
      if (ig.ignores(testPath)) {
        return null;
      }
    }

    if (isDirectory) {
      let dirents;
      try {
        dirents = await fs.readdir(currentPath, { withFileTypes: true });
      } catch {
        return null;
      }

      const children: FileNode[] = [];
      for (const dirent of dirents) {
        const entry = dirent.name;
        if (entry === '.' || entry === '..') continue;

        const childCurrent = path.normalize(`${currentPath}/${entry}`);
        // Path traversal guard: ensure child path remains strictly inside currentPath
        if (!childCurrent.startsWith(currentPath)) {
          continue;
        }

        const childRel = relPath ? `${relPath}/${entry}` : entry;
        try {
          const childNode = await walk(childCurrent, childRel);
          if (childNode) {
            children.push(childNode);
          }
        } catch {
          // Ignore unreadable entries
        }
      }

      // Sort: folders first, then files alphabetically
      children.sort((a, b) => {
        if (a.isDirectory === b.isDirectory) {
          return a.name.localeCompare(b.name);
        }
        return a.isDirectory ? -1 : 1;
      });

      return {
        id: forwardSlashRel || '/',
        name: baseName,
        path: currentPath,
        relativePath: forwardSlashRel,
        isDirectory: true,
        children,
      };
    } else {
      const isBinary = await isBinaryFile(currentPath);
      return {
        id: forwardSlashRel,
        name: baseName,
        path: currentPath,
        relativePath: forwardSlashRel,
        isDirectory: false,
        size: stats.size,
        isBinary,
      };
    }
  }

  const rootNode = await walk(normalizedRoot, '');
  if (!rootNode) {
    return {
      id: '/',
      name: path.basename(normalizedRoot),
      path: normalizedRoot,
      relativePath: '',
      isDirectory: true,
      children: [],
    };
  }
  return rootNode;
}
