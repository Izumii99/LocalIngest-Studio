import React from 'react';
import { TreeNode } from './TreeNode.tsx';
import type { FileNode, CheckState } from '../../types/index.ts';

interface FileTreeProps {
  rootNode: FileNode | null;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  getNodeCheckState: (node: FileNode) => CheckState;
  onToggleCheck: (node: FileNode) => void;
  onToggleExpand: (path: string) => void;
  isNodeExpanded: (id: string) => boolean;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
  onRefresh?: () => void;
  isLoading?: boolean;
  selectedCount: number;
  totalCount: number;
  maxFileSizeKB?: number;
  availableExtensions?: { ext: string; count: number }[];
  onToggleExtension?: (ext: string) => void;
  onExcludeTests?: () => void;
  gitChangedCount?: number;
  onSelectGitChanged?: () => void;
}

export const FileTree: React.FC<FileTreeProps> = ({
  rootNode,
  searchQuery,
  onSearchChange,
  getNodeCheckState,
  onToggleCheck,
  onToggleExpand,
  isNodeExpanded,
  onSelectAll,
  onDeselectAll,
  onExpandAll,
  onCollapseAll,
  onRefresh,
  isLoading,
  selectedCount,
  totalCount,
  maxFileSizeKB,
  availableExtensions = [],
  onToggleExtension,
  onExcludeTests,
  gitChangedCount = 0,
  onSelectGitChanged,
}) => {
  if (!rootNode) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center rounded-xl border-2 border-dashed border-craft-700 bg-craft-900/90 h-full select-none">
        <div className="w-12 h-12 rounded-xl bg-craft-800 border-2 border-craft-700 flex items-center justify-center mb-3 shadow-brutal-sm text-neon-yellow text-2xl">
          📁
        </div>
        <p className="text-sm font-bold font-sketch text-stone-200">No Project Loaded</p>
        <p className="text-xs text-craft-500 font-mono mt-1 max-w-[220px] leading-relaxed">
          Click "Open Folder" in the top bar to inspect and ingest a local codebase
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 border-[2.5px] border-craft-700 bg-craft-900/90 rounded-xl p-4 flex flex-col justify-between relative shadow-brutal h-full overflow-hidden select-none min-h-0">
      <div className="space-y-3 flex-1 flex flex-col min-h-0">
        {/* Search Input with Sketched Hand-Drawn Feel */}
        <div className="relative shrink-0">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-craft-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Filter files by name or extension..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-8 py-2 bg-craft-950 border-2 border-craft-700 focus:border-neon-lilac focus:ring-0 rounded-xl text-xs font-mono text-stone-200 placeholder-craft-500 shadow-brutal-sm transition-all outline-none"
            id="search-input"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-craft-500 hover:text-stone-200 cursor-pointer font-bold text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* Extension Quick-Pill Badges (Felt-tip markers style) */}
        <div className="flex items-center gap-1.5 flex-wrap pt-0.5 shrink-0" id="extension-pill-container">
          {onExcludeTests && (
            <button
              type="button"
              onClick={onExcludeTests}
              className="ext-pill active px-2.5 py-1 text-[11px] font-mono font-bold bg-neon-coral/20 text-neon-coral border border-neon-coral rounded-lg shadow-sm hover:scale-105 transition-transform cursor-pointer"
              title="Deselect test files (*.test.*, *.spec.*)"
              data-ext="-Tests"
            >
              -Tests
            </button>
          )}

          {gitChangedCount > 0 && onSelectGitChanged && (
            <button
              type="button"
              onClick={onSelectGitChanged}
              className="ext-pill px-2.5 py-1 text-[11px] font-mono font-bold bg-neon-lilac/20 text-neon-lilac border border-neon-lilac rounded-lg shadow-sm hover:scale-105 transition-transform cursor-pointer flex items-center gap-1"
              title="Select all files modified or added in Git"
            >
              <span>🌿</span>
              <span>Git ({gitChangedCount})</span>
            </button>
          )}

          {availableExtensions.map(({ ext, count }) => (
            <button
              key={ext}
              type="button"
              onClick={() => onToggleExtension?.(ext)}
              className="ext-pill px-2.5 py-1 text-[11px] font-mono font-bold bg-craft-800 text-craft-300 border border-craft-700 rounded-lg shadow-sm hover:border-craft-500 hover:text-white transition-all cursor-pointer"
              title={`Toggle ${ext} files (${count})`}
              data-ext={ext}
            >
              {ext}
            </button>
          ))}
        </div>

        {/* Multi-Select Action Strip & File Counter */}
        <div className="flex items-center justify-between pt-1 pb-1 border-b border-craft-750/70 shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onSelectAll}
              className="px-3 py-1 bg-craft-800 border-2 border-neon-lilac/80 text-neon-lilac text-xs font-bold rounded-lg shadow-brutal-sm hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all flex items-center gap-1.5 cursor-pointer"
              id="btn-select-all"
            >
              <span>☑</span>
              <span>Select All</span>
            </button>
            <button
              type="button"
              onClick={onDeselectAll}
              className="px-3 py-1 bg-craft-850 border border-craft-700 text-craft-300 text-xs font-semibold rounded-lg hover:border-craft-500 hover:text-white transition-all flex items-center gap-1 cursor-pointer"
              id="btn-clear-all"
            >
              <span>☐ Clear</span>
            </button>
          </div>

          {/* Up/Down Expand Chevron Buttons & Selected Count */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-craft-500 bg-craft-950 px-1.5 py-0.5 rounded border border-craft-800">
              {onRefresh && (
                <button
                  type="button"
                  onClick={onRefresh}
                  disabled={isLoading}
                  className="hover:text-neon-mint transition-colors p-0.5 cursor-pointer disabled:opacity-50"
                  title="Rescan Tree & Files (F5 / Ctrl+R)"
                >
                  <svg
                    className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-neon-mint' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth="2.5"
                  >
                    <path
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              )}
              <button
                type="button"
                onClick={onCollapseAll}
                className="hover:text-neon-yellow transition-colors p-0.5 cursor-pointer"
                title="Collapse All"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
                </svg>
              </button>
              <button
                type="button"
                onClick={onExpandAll}
                className="hover:text-neon-yellow transition-colors p-0.5 cursor-pointer"
                title="Expand All"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M5 15l7-7 7 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
                </svg>
              </button>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-mono text-craft-500 tracking-wider block leading-none">
                Files
              </span>
              <span className="text-xs font-mono font-bold text-stone-200">
                <strong className="text-neon-yellow font-bold text-sm" id="tree-selected-count">
                  {selectedCount}
                </strong>{' '}
                / {totalCount}
              </span>
            </div>
          </div>
        </div>

        {/* Tree View Container (Cardboard Notebook Sheet style) */}
        <div
          className="tree-container overflow-y-auto flex-1 pr-1 space-y-1 font-mono text-xs text-craft-300 min-h-0"
          id="file-tree-view"
        >
          {rootNode.children && rootNode.children.length > 0 ? (
            rootNode.children.map((child) => (
              <TreeNode
                key={child.id}
                node={child}
                level={0}
                checkState={getNodeCheckState(child)}
                isExpanded={isNodeExpanded(child.id)}
                onToggleCheck={onToggleCheck}
                onToggleExpand={onToggleExpand}
                getNodeCheckState={getNodeCheckState}
                isNodeExpanded={isNodeExpanded}
                searchQuery={searchQuery}
                maxFileSizeKB={maxFileSizeKB}
              />
            ))
          ) : (
            <div className="p-4 text-center text-xs font-mono text-craft-500">
              Folder is empty or all contents were ignored by filters.
            </div>
          )}
        </div>
      </div>

      {/* Left Panel Footer Note */}
      <div className="mt-3 pt-2 border-t border-craft-800 flex items-center justify-between text-[11px] text-craft-500 font-sketch shrink-0">
        <span>Fast filter with wildcards (*.cs)</span>
        <span className="text-craft-400 font-mono text-[10px]">v1.0.2</span>
      </div>
    </div>
  );
};
