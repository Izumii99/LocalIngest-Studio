import { useState, useMemo, useCallback } from 'react';
import type { FileNode, CheckState } from '../../types/index.ts';

// Helper to collect all non-binary leaf files under a node
export function getDescendantFiles(node: FileNode): FileNode[] {
  if (!node.isDirectory) {
    return node.isBinary ? [] : [node];
  }
  const files: FileNode[] = [];
  if (node.children) {
    for (const child of node.children) {
      files.push(...getDescendantFiles(child));
    }
  }
  return files;
}

export function useFileTree(rootNode: FileNode | null, maxFileSizeKB = 100) {
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set());
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set(['/', '']));
  const [searchQuery, setSearchQuery] = useState('');

  // Collect all valid selectable files in the entire tree
  const allSelectableFiles = useMemo(() => {
    if (!rootNode) return [];
    return getDescendantFiles(rootNode);
  }, [rootNode]);

  // Compute available extensions in this codebase (sorted by count)
  const availableExtensions = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const file of allSelectableFiles) {
      const parts = file.name.split('.');
      if (parts.length > 1) {
        const ext = `.${parts.pop()!.toLowerCase()}`;
        counts[ext] = (counts[ext] || 0) + 1;
      }
    }
    return Object.entries(counts)
      .map(([ext, count]) => ({ ext, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8); // Top 8 extensions
  }, [allSelectableFiles]);

  // Compute 3-state check status for any node
  const getNodeCheckState = useCallback(
    (node: FileNode): CheckState => {
      if (!node.isDirectory) {
        return selectedPaths.has(node.relativePath) ? 'checked' : 'unchecked';
      }

      const descendants = getDescendantFiles(node);
      if (descendants.length === 0) return 'unchecked';

      let selectedCount = 0;
      for (const file of descendants) {
        if (selectedPaths.has(file.relativePath)) {
          selectedCount++;
        }
      }

      if (selectedCount === 0) return 'unchecked';
      if (selectedCount === descendants.length) return 'checked';
      return 'indeterminate';
    },
    [selectedPaths]
  );

  // Toggle selection for a node (file or directory)
  const toggleNode = useCallback(
    (node: FileNode) => {
      setSelectedPaths((prev) => {
        const next = new Set(prev);
        const descendants = getDescendantFiles(node);

        if (!node.isDirectory) {
          if (next.has(node.relativePath)) {
            next.delete(node.relativePath);
          } else {
            next.add(node.relativePath);
          }
        } else {
          // If folder is currently checked, uncheck all its files. Otherwise, check all.
          const currentState = getNodeCheckState(node);
          const shouldCheck = currentState !== 'checked';

          for (const file of descendants) {
            if (shouldCheck) {
              next.add(file.relativePath);
            } else {
              next.delete(file.relativePath);
            }
          }
        }
        return next;
      });
    },
    [getNodeCheckState]
  );

  // Select all non-binary files (smart skipping files exceeding maxFileSizeKB)
  const selectAll = useCallback(() => {
    const next = new Set<string>();
    const limitBytes = maxFileSizeKB > 0 ? maxFileSizeKB * 1024 : Infinity;

    for (const file of allSelectableFiles) {
      if ((file.size || 0) <= limitBytes) {
        next.add(file.relativePath);
      }
    }
    setSelectedPaths(next);
  }, [allSelectableFiles, maxFileSizeKB]);

  // Deselect all files
  const deselectAll = useCallback(() => {
    setSelectedPaths(new Set());
  }, []);

  // Filter selection by extension
  const toggleByExtension = useCallback(
    (ext: string) => {
      setSelectedPaths((prev) => {
        const next = new Set(prev);
        const matchingFiles = allSelectableFiles.filter((f) =>
          f.name.toLowerCase().endsWith(ext.toLowerCase())
        );
        const allSelected = matchingFiles.every((f) => next.has(f.relativePath));

        for (const file of matchingFiles) {
          if (allSelected) {
            next.delete(file.relativePath);
          } else {
            next.add(file.relativePath);
          }
        }
        return next;
      });
    },
    [allSelectableFiles]
  );

  // Deselect test files
  const excludeTestFiles = useCallback(() => {
    const testPattern = /(\.(test|spec)\.[a-z0-9]+$)|([/\\]__(tests|mocks)__[/\\])/i;
    setSelectedPaths((prev) => {
      const next = new Set(prev);
      for (const path of prev) {
        if (testPattern.test(path)) {
          next.delete(path);
        }
      }
      return next;
    });
  }, []);

  // Git-aware: Select only files changed in git
  const selectGitChanged = useCallback(
    (changedRelativePaths: string[]) => {
      const changedSet = new Set(changedRelativePaths.map((p) => p.replace(/\\/g, '/')));
      const next = new Set<string>();

      for (const file of allSelectableFiles) {
        if (changedSet.has(file.relativePath)) {
          next.add(file.relativePath);
        }
      }

      setSelectedPaths(next);
      // Auto expand folders of changed files
      setExpandedPaths((prev) => {
        const expanded = new Set(prev);
        for (const relPath of next) {
          const parts = relPath.split('/');
          let acc = '';
          for (let i = 0; i < parts.length - 1; i++) {
            acc = acc ? `${acc}/${parts[i]}` : parts[i];
            expanded.add(acc);
          }
        }
        return expanded;
      });
    },
    [allSelectableFiles]
  );

  // Expand / collapse folder
  const toggleExpand = useCallback((path: string) => {
    setExpandedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }, []);

  // Expand all folders
  const expandAll = useCallback(() => {
    if (!rootNode) return;
    const paths = new Set<string>();
    function collectDirs(node: FileNode) {
      if (node.isDirectory) {
        paths.add(node.id);
        if (node.children) {
          node.children.forEach(collectDirs);
        }
      }
    }
    collectDirs(rootNode);
    setExpandedPaths(paths);
  }, [rootNode]);

  // Collapse all folders except root
  const collapseAll = useCallback(() => {
    setExpandedPaths(new Set(['/', '']));
  }, []);

  // Filtered files count & stats
  const selectedFiles = useMemo(() => {
    return allSelectableFiles.filter((f) => selectedPaths.has(f.relativePath));
  }, [allSelectableFiles, selectedPaths]);

  const selectedTotalBytes = useMemo(() => {
    return selectedFiles.reduce((acc, f) => acc + (f.size || 0), 0);
  }, [selectedFiles]);

  return {
    selectedPaths,
    setSelectedPaths,
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
    totalSelectableFiles: allSelectableFiles.length,
    availableExtensions,
    toggleByExtension,
    excludeTestFiles,
    selectGitChanged,
  };
}
