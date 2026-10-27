import React, { useEffect, useRef } from 'react';
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  FileCode2,
  FileJson,
  FileText,
  FileCode,
  File,
  Binary,
} from 'lucide-react';
import type { FileNode, CheckState } from '../../types/index.ts';

interface TreeNodeProps {
  node: FileNode;
  level: number;
  checkState: CheckState;
  isExpanded: boolean;
  onToggleCheck: (node: FileNode) => void;
  onToggleExpand: (path: string) => void;
  getNodeCheckState: (node: FileNode) => CheckState;
  isNodeExpanded: (id: string) => boolean;
  searchQuery: string;
  maxFileSizeKB?: number;
}

export function formatFileSize(bytes?: number): string {
  if (bytes === undefined || bytes === null) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(node: FileNode, isExpanded: boolean) {
  if (node.isDirectory) {
    return isExpanded ? (
      <FolderOpen className="w-3.5 h-3.5 text-amber-400 shrink-0" />
    ) : (
      <Folder className="w-3.5 h-3.5 text-amber-400/90 shrink-0" />
    );
  }
  if (node.isBinary) return <Binary className="w-3.5 h-3.5 text-stone-600 shrink-0" />;

  const ext = node.name.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'ts':
    case 'tsx':
      return <FileCode2 className="w-3.5 h-3.5 text-sky-400 shrink-0" />;
    case 'js':
    case 'jsx':
      return <FileCode2 className="w-3.5 h-3.5 text-yellow-400 shrink-0" />;
    case 'json':
      return <FileJson className="w-3.5 h-3.5 text-orange-400 shrink-0" />;
    case 'css':
    case 'scss':
      return <FileCode className="w-3.5 h-3.5 text-violet-400 shrink-0" />;
    case 'html':
      return <FileCode className="w-3.5 h-3.5 text-rose-400 shrink-0" />;
    case 'md':
    case 'txt':
      return <FileText className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
    case 'py':
      return <FileCode2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />;
    case 'cs':
      return <FileCode2 className="w-3.5 h-3.5 text-green-400 shrink-0" />;
    default:
      return <File className="w-3.5 h-3.5 text-stone-500 shrink-0" />;
  }
}

export const TreeNode: React.FC<TreeNodeProps> = React.memo(({
  node, level, checkState, isExpanded, onToggleCheck, onToggleExpand,
  getNodeCheckState, isNodeExpanded, searchQuery, maxFileSizeKB,
}) => {
  const checkboxRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.indeterminate = checkState === 'indeterminate';
    }
  }, [checkState]);

  const isMatch = searchQuery && node.name.toLowerCase().includes(searchQuery.toLowerCase());
  const isOversize = !node.isDirectory && node.size !== undefined && maxFileSizeKB && maxFileSizeKB > 0 && node.size > maxFileSizeKB * 1024;

  return (
    <div>
      <div
        className={`group tree-row flex items-center gap-1 py-[3px] px-1 rounded-lg cursor-pointer ${
          checkState === 'indeterminate' ? 'tree-row-partial' : ''
        } ${isOversize ? 'tree-row-warning' : ''}`}
        style={{
          paddingLeft: `${Math.max(level * 14 + 4, 4)}px`,
          background: isMatch ? 'rgba(192, 132, 252, 0.15)' : undefined,
        }}
        onClick={(e) => {
          e.stopPropagation();
          if (node.isDirectory) onToggleExpand(node.id);
          else if (!node.isBinary) onToggleCheck(node);
        }}
      >
        {/* Chevron */}
        <div className="w-4 h-4 flex items-center justify-center shrink-0">
          {node.isDirectory && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleExpand(node.id);
              }}
              className="text-stone-500 hover:text-stone-200 transition-colors"
            >
              {isExpanded ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
            </button>
          )}
        </div>

        {/* Checkbox */}
        <input
          ref={checkboxRef}
          type="checkbox"
          disabled={node.isBinary}
          checked={checkState === 'checked'}
          onChange={(e) => {
            e.stopPropagation();
            onToggleCheck(node);
          }}
          onClick={(e) => e.stopPropagation()}
          className="tree-checkbox shrink-0"
        />

        {/* Icon */}
        {getFileIcon(node, isExpanded)}

        {/* Name */}
        <span
          className="truncate flex-1 text-[12px] font-mono tracking-tight"
          style={{
            color: node.isBinary
              ? '#554d43'
              : node.isDirectory
              ? '#ece5db'
              : isMatch
              ? '#facc15'
              : '#d5cbbf',
            fontWeight: node.isDirectory ? 600 : 400,
          }}
        >
          {node.name}
        </span>

        {/* Partial badge */}
        {checkState === 'indeterminate' && (
          <span className="tree-badge-partial shrink-0">partial</span>
        )}

        {/* Binary tag */}
        {node.isBinary && (
          <span className="text-[9px] uppercase tracking-widest px-1 py-0.2 rounded font-mono text-stone-600 bg-stone-900 border border-stone-800 shrink-0">
            bin
          </span>
        )}

        {/* Oversize warning badge (Sticker look) */}
        {isOversize && (
          <span
            className="pill-size-warning shrink-0"
            title={`Exceeds max limit (${maxFileSizeKB} KB). Content will be omitted in ingest.`}
          >
            &gt;{maxFileSizeKB}KB
          </span>
        )}

        {/* Folder tag or File Size */}
        {node.isDirectory ? (
          <span className="tree-tag-dir font-mono text-[10px] shrink-0">dir</span>
        ) : (
          node.size !== undefined && !node.isBinary && (
            <span className="tree-file-size font-mono text-[10.5px] shrink-0">
              {formatFileSize(node.size)}
            </span>
          )
        )}
      </div>

      {/* Children */}
      {node.isDirectory && isExpanded && node.children && (
        <div
          style={{
            borderLeft: '1px dashed var(--craft-700)',
            marginLeft: `${Math.max(level * 14 + 12, 12)}px`,
            paddingLeft: '0px',
          }}
        >
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              level={level + 1}
              checkState={getNodeCheckState(child)}
              isExpanded={isNodeExpanded(child.id)}
              onToggleCheck={onToggleCheck}
              onToggleExpand={onToggleExpand}
              getNodeCheckState={getNodeCheckState}
              isNodeExpanded={isNodeExpanded}
              searchQuery={searchQuery}
              maxFileSizeKB={maxFileSizeKB}
            />
          ))}
        </div>
      )}
    </div>
  );
});
