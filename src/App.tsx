import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { HeaderBar } from './components/HeaderBar.tsx';
import { FileTree } from './components/FileTree/FileTree.tsx';
import { StatsBar } from './components/StatsBar.tsx';
import { PreviewPanel } from './components/PreviewPanel.tsx';
import { SettingsModal } from './components/SettingsModal.tsx';
import { useFileTree } from './components/FileTree/useFileTree.ts';
import { countTokens } from '../electron/services/tokenizer.ts';
import { formatOutput } from '../electron/services/formatter.ts';
import { scanForSecrets } from './services/secretDetector.ts';
import type { FileNode, OutputFormat, ScanOptions } from './types/index.ts';

export const App: React.FC = () => {
  const [currentPath, setCurrentPath] = useState<string | null>(null);
  const [rootNode, setRootNode] = useState<FileNode | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [format, setFormat] = useState<OutputFormat>('xml');
  const [includeAsciiTree, setIncludeAsciiTree] = useState(true);
  const [isCopied, setIsCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Feature options: Max file size limit & Secret redaction (persisted via native Electron & localStorage)
  const [maxFileSizeKB, setMaxFileSizeKB] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('localingest_max_file_size_kb');
      return saved ? Number(saved) : 100;
    } catch {
      return 100;
    }
  });
  const [redactSecrets, setRedactSecrets] = useState<boolean>(true);
  const [gitChangedFiles, setGitChangedFiles] = useState<string[]>([]);

  // Persistent Recent Folders
  const [recentFolders, setRecentFolders] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('localingest_recent_folders');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // On mount: Hydrate persistent preferences from native backend
  useEffect(() => {
    if (window.electronAPI?.getPreferences) {
      window.electronAPI
        .getPreferences()
        .then((prefs) => {
          if (prefs) {
            if (Array.isArray(prefs.recentFolders)) {
              setRecentFolders(prefs.recentFolders);
              try {
                localStorage.setItem('localingest_recent_folders', JSON.stringify(prefs.recentFolders));
              } catch {}
            }
            if (typeof prefs.maxFileSizeKB === 'number' && prefs.maxFileSizeKB > 0) {
              setMaxFileSizeKB(prefs.maxFileSizeKB);
              try {
                localStorage.setItem('localingest_max_file_size_kb', String(prefs.maxFileSizeKB));
              } catch {}
            }
            if (prefs.fileSelectionCache && typeof prefs.fileSelectionCache === 'object') {
              try {
                const localCache = JSON.parse(
                  localStorage.getItem('localingest_file_selection_cache') || '{}'
                );
                const merged = { ...prefs.fileSelectionCache, ...localCache };
                localStorage.setItem('localingest_file_selection_cache', JSON.stringify(merged));
              } catch {}
            }
          }
        })
        .catch((err) => {
          console.warn('Native preferences load warning:', err);
        });
    }
  }, []);

  const addRecentFolder = useCallback((folderPath: string) => {
    setRecentFolders((prev) => {
      const filtered = prev.filter((p) => p !== folderPath);
      const updated = [folderPath, ...filtered].slice(0, 8);
      try {
        localStorage.setItem('localingest_recent_folders', JSON.stringify(updated));
      } catch {}
      if (window.electronAPI?.setPreferences) {
        window.electronAPI.setPreferences({ recentFolders: updated }).catch(console.error);
      }
      return updated;
    });
  }, []);

  const clearRecentFolders = useCallback(() => {
    setRecentFolders([]);
    try {
      localStorage.removeItem('localingest_recent_folders');
    } catch {}
    if (window.electronAPI?.setPreferences) {
      window.electronAPI.setPreferences({ recentFolders: [] }).catch(console.error);
    }
  }, []);

  const handleMaxFileSizeChange = useCallback((newSizeKB: number) => {
    setMaxFileSizeKB(newSizeKB);
    try {
      localStorage.setItem('localingest_max_file_size_kb', String(newSizeKB));
    } catch {}
    if (window.electronAPI?.setPreferences) {
      window.electronAPI.setPreferences({ maxFileSizeKB: newSizeKB }).catch(console.error);
    }
  }, []);

  const [scanOptions, setScanOptions] = useState<ScanOptions>({
    respectGitignore: true,
    customIgnoreRules: [],
    maxFileSizeKB: 100,
  });

  // Synchronize scanOptions.maxFileSizeKB with toolbar maxFileSizeKB
  useEffect(() => {
    if (scanOptions.maxFileSizeKB !== maxFileSizeKB) {
      setScanOptions((prev) => ({ ...prev, maxFileSizeKB }));
    }
  }, [maxFileSizeKB]);

  // Cached file contents for fast real-time preview and token calculation
  const [loadedContents, setLoadedContents] = useState<Record<string, string>>({});
  const [isLoadingContent, setIsLoadingContent] = useState(false);

  // Hook for 3-state checkbox file tree with smart filtering
  const {
    selectedPaths,
    expandedPaths,
    searchQuery,
    setSearchQuery,
    getNodeCheckState,
    toggleNode,
    selectAll,
    deselectAll,
    toggleExpand,
    expandAll,
    collapseAll,
    selectedFiles,
    selectedTotalBytes,
    totalSelectableFiles,
    availableExtensions,
    toggleByExtension,
    excludeTestFiles,
    selectGitChanged,
  } = useFileTree(rootNode, maxFileSizeKB, currentPath);

  // Secret scanner
  const secretsFindings = useMemo(() => {
    return scanForSecrets(loadedContents);
  }, [loadedContents]);

  // Helper: Open folder picker
  const handleOpenFolder = async () => {
    try {
      setIsLoading(true);
      let selectedDir: string | null = null;

      if (window.electronAPI) {
        selectedDir = await window.electronAPI.selectDirectory(currentPath || undefined);
      } else {
        selectedDir = prompt('Enter absolute project directory path to scan:');
      }

      if (!selectedDir) {
        setIsLoading(false);
        return;
      }

      setCurrentPath(selectedDir);
      await performScan(selectedDir, scanOptions);
    } catch (err: any) {
      alert(`Failed to open directory: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper: Rescan and refresh codebase context
  const handleRefresh = useCallback(async () => {
    if (!currentPath || isLoading) return;
    setLoadedContents({}); // Purge cached file contents so modified files on disk get freshly read
    await performScan(currentPath, scanOptions);
  }, [currentPath, isLoading, scanOptions]);

  // Global F5 / Ctrl+R keyboard shortcut to refresh
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F5' || ((e.ctrlKey || e.metaKey) && (e.key === 'r' || e.key === 'R'))) {
        e.preventDefault();
        handleRefresh();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleRefresh]);

  // Perform directory scan & Git status check
  const performScan = async (dirPath: string, options: ScanOptions) => {
    setIsLoading(true);
    try {
      if (window.electronAPI) {
        const tree = await window.electronAPI.scanDirectory(dirPath, options);
        setRootNode(tree);
        setCurrentPath(dirPath);
        addRecentFolder(dirPath);
        if (window.electronAPI.setPreferences) {
          window.electronAPI.setPreferences({ lastOpenedFolder: dirPath }).catch(console.error);
        }

        // Check Git status
        try {
          const gitRes = await window.electronAPI.getGitStatus(dirPath);
          if (gitRes.isGit) {
            setGitChangedFiles(gitRes.changedFiles);
          } else {
            setGitChangedFiles([]);
          }
        } catch {
          setGitChangedFiles([]);
        }
      } else {
        // Fallback mock tree for web mode
        const mockTree: FileNode = {
          id: '/',
          name: dirPath.split(/[/\\]/).pop() || 'project',
          path: dirPath,
          relativePath: '',
          isDirectory: true,
          children: [
            {
              id: 'src',
              name: 'src',
              path: `${dirPath}/src`,
              relativePath: 'src',
              isDirectory: true,
              children: [
                {
                  id: 'src/App.tsx',
                  name: 'App.tsx',
                  path: `${dirPath}/src/App.tsx`,
                  relativePath: 'src/App.tsx',
                  isDirectory: false,
                  size: 4200,
                },
                {
                  id: 'src/main.tsx',
                  name: 'main.tsx',
                  path: `${dirPath}/src/main.tsx`,
                  relativePath: 'src/main.tsx',
                  isDirectory: false,
                  size: 850,
                },
              ],
            },
            {
              id: 'package.json',
              name: 'package.json',
              path: `${dirPath}/package.json`,
              relativePath: 'package.json',
              isDirectory: false,
              size: 1200,
            },
          ],
        };
        setRootNode(mockTree);
      }
    } catch (err: any) {
      alert(`Scan failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch file content when selectedFiles changes
  useEffect(() => {
    let isCancelled = false;

    async function loadContents() {
      if (selectedFiles.length === 0) {
        return;
      }

      // Check which paths need loading
      const missingPaths = selectedFiles
        .map((f) => f.path)
        .filter((p) => !(p in loadedContents));

      if (missingPaths.length === 0) return;

      setIsLoadingContent(true);
      try {
        if (window.electronAPI) {
          const contents = await window.electronAPI.readFilesContent(missingPaths);
          if (!isCancelled) {
            setLoadedContents((prev) => ({ ...prev, ...contents }));
          }
        } else {
          // Browser preview mock content
          const mockContents: Record<string, string> = {};
          for (const p of missingPaths) {
            mockContents[p] = `// Content of ${p}\nconsole.log("LocalIngest Studio Demo");`;
          }
          if (!isCancelled) {
            setLoadedContents((prev) => ({ ...prev, ...mockContents }));
          }
        }
      } catch (err) {
        console.error('Error reading contents:', err);
      } finally {
        if (!isCancelled) {
          setIsLoadingContent(false);
        }
      }
    }

    loadContents();
    return () => {
      isCancelled = true;
    };
  }, [selectedFiles]);

  // Compute formatted preview text (respects maxFileSizeKB & redactSecrets)
  const formattedOutput = useMemo(() => {
    if (!rootNode || selectedFiles.length === 0) {
      return '';
    }

    const items = selectedFiles.map((file) => ({
      relativePath: file.relativePath,
      content: loadedContents[file.path] || '// Loading file content...',
      size: file.size,
    }));

    return formatOutput(items, {
      format,
      includeAsciiTree,
      treeRoot: rootNode,
      selectedPaths,
      maxFileSizeKB,
      redactSecrets,
    });
  }, [
    rootNode,
    selectedFiles,
    loadedContents,
    format,
    includeAsciiTree,
    selectedPaths,
    maxFileSizeKB,
    redactSecrets,
  ]);

  // Estimate total tokens real-time using js-tiktoken
  const estimatedTokens = useMemo(() => {
    if (!formattedOutput) return 0;
    return countTokens(formattedOutput);
  }, [formattedOutput]);

  // Copy to clipboard
  const handleCopy = useCallback(async () => {
    if (!formattedOutput) return;
    try {
      if (window.electronAPI) {
        await window.electronAPI.copyToClipboard(formattedOutput);
      } else {
        await navigator.clipboard.writeText(formattedOutput);
      }
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [formattedOutput]);

  // Export to file
  const handleExport = useCallback(async () => {
    if (!formattedOutput) return;
    setIsExporting(true);
    try {
      const ext = format === 'xml' ? 'xml' : format === 'markdown' ? 'md' : 'txt';
      const projectName = rootNode?.name || 'codebase';
      const defaultFileName = `${projectName}-context.${ext}`;

      if (window.electronAPI) {
        await window.electronAPI.saveOutputFile(defaultFileName, formattedOutput);
      } else {
        const blob = new Blob([formattedOutput], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = defaultFileName;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Failed to export:', err);
    } finally {
      setIsExporting(false);
    }
  }, [formattedOutput, format, rootNode]);

  return (
    <div
      className="h-screen w-screen p-2.5 lg:p-4 flex flex-col items-center justify-center font-sans antialiased overflow-hidden select-none relative"
      style={{
        backgroundColor: '#0e0d0c',
        backgroundImage: `radial-gradient(#24201c 0.75px, transparent 0.75px), radial-gradient(#1c1916 0.75px, #0e0d0c 0.75px)`,
        backgroundSize: '24px 24px, 12px 12px',
        backgroundPosition: '0 0, 12px 12px',
        color: '#dfd8ce',
      }}
    >
      {/* BEGIN: ApplicationWindow Container */}
      <main className="w-full h-full max-w-[1440px] bg-craft-900 border-[2.5px] border-craft-700/80 rounded-2xl shadow-2xl overflow-hidden relative flex flex-col transition-all duration-300 min-h-0">
        {/* Top Decorative Pinned Tape Strip */}
        <div
          aria-hidden="true"
          className="absolute -top-2 left-1/2 -translate-x-1/2 w-36 h-5 washi-tape-yellow opacity-85 rotate-[-1.5deg] z-50 pointer-events-none rounded-[2px]"
        />

        {/* Top Header */}
        <HeaderBar
          currentPath={currentPath}
          onOpenFolder={handleOpenFolder}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onRefresh={handleRefresh}
          isLoading={isLoading}
          recentFolders={recentFolders}
          onSelectRecentFolder={(folderPath) => {
            setCurrentPath(folderPath);
            performScan(folderPath, scanOptions);
          }}
          onClearRecentFolders={clearRecentFolders}
        />

        {/* Main Split Layout Grid */}
        <div className="flex-1 min-h-0 p-3.5 grid grid-cols-1 lg:grid-cols-12 gap-3.5 overflow-hidden">
          {/* Left Side: Interactive 3-State File Tree (5 columns) */}
          <section className="lg:col-span-5 h-full flex flex-col min-h-0">
            <FileTree
              rootNode={rootNode}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              getNodeCheckState={getNodeCheckState}
              onToggleCheck={toggleNode}
              onToggleExpand={toggleExpand}
              isNodeExpanded={(id) => expandedPaths.has(id)}
              onSelectAll={selectAll}
              onDeselectAll={deselectAll}
              onExpandAll={expandAll}
              onCollapseAll={collapseAll}
              onRefresh={handleRefresh}
              isLoading={isLoading}
              selectedCount={selectedFiles.length}
              totalCount={totalSelectableFiles}
              maxFileSizeKB={maxFileSizeKB}
              availableExtensions={availableExtensions}
              onToggleExtension={toggleByExtension}
              onExcludeTests={excludeTestFiles}
              gitChangedCount={gitChangedFiles.length}
              onSelectGitChanged={() => selectGitChanged(gitChangedFiles)}
            />
          </section>

          {/* Right Side: Action Stats Bar & Live Output Preview (7 columns) */}
          <section className="lg:col-span-7 h-full flex flex-col min-h-0 gap-3.5">
            <StatsBar
              selectedCount={selectedFiles.length}
              totalCount={totalSelectableFiles}
              selectedSizeBytes={selectedTotalBytes}
              estimatedTokens={estimatedTokens}
              format={format}
              onFormatChange={setFormat}
              onCopy={handleCopy}
              onExport={handleExport}
              isCopied={isCopied}
              isExporting={isExporting}
              maxFileSizeKB={maxFileSizeKB}
              onMaxFileSizeChange={handleMaxFileSizeChange}
              secretsCount={secretsFindings.length}
            />

            <PreviewPanel
              content={formattedOutput}
              includeAsciiTree={includeAsciiTree}
              onToggleAsciiTree={setIncludeAsciiTree}
              isLoadingPreview={isLoadingContent}
              redactSecrets={redactSecrets}
              onToggleRedactSecrets={setRedactSecrets}
              secretsCount={secretsFindings.length}
            />
          </section>
        </div>
      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        options={scanOptions}
        onOptionsChange={(newOpts) => {
          setScanOptions(newOpts);
          if (newOpts.maxFileSizeKB !== undefined && newOpts.maxFileSizeKB !== maxFileSizeKB) {
            handleMaxFileSizeChange(newOpts.maxFileSizeKB);
          }
        }}
        onApplyAndRescan={() => {
          if (currentPath) {
            performScan(currentPath, scanOptions);
          }
        }}
      />
    </div>
  );
};

export default App;
