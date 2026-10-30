import React from 'react';
import type { OutputFormat } from '../types/index.ts';

// Discrete GitIngest-style file size steps (in KB, up to 100MB, with 0 = All)
export const FILE_SIZE_STEPS_KB = [
  10,         // 10 KB
  20,         // 20 KB
  50,         // 50 KB
  100,        // 100 KB (default)
  200,        // 200 KB
  500,        // 500 KB
  1_000,      // 1 MB
  2_000,      // 2 MB
  5_000,      // 5 MB
  10_000,     // 10 MB
  20_000,     // 20 MB
  50_000,     // 50 MB
  100_000,    // 100 MB
  0,          // All (Unlimited)
];

export function formatSizeStep(kb: number): string {
  if (kb === 0) return 'All (∞)';
  if (kb < 1000) return `${kb} KB`;
  return `${(kb / 1000).toFixed(0)} MB`;
}

export function splitPayloadSize(bytes: number): { value: string; unit: string } {
  if (bytes === 0) return { value: '0', unit: 'B' };
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const val = parseFloat((bytes / Math.pow(k, i)).toFixed(1)).toString();
  return { value: val, unit: sizes[i] };
}

interface StatsBarProps {
  selectedCount: number;
  totalCount: number;
  selectedSizeBytes: number;
  estimatedTokens: number;
  format: OutputFormat;
  onFormatChange: (fmt: OutputFormat) => void;
  onCopy: () => void;
  onExport: () => void;
  onExportSplit?: () => void;
  isCopied: boolean;
  isExporting: boolean;
  maxFileSizeKB: number;
  onMaxFileSizeChange: (kb: number) => void;
  secretsCount?: number;
}

export const StatsBar: React.FC<StatsBarProps> = ({
  selectedCount,
  totalCount,
  selectedSizeBytes,
  estimatedTokens,
  format,
  onFormatChange,
  onCopy,
  onExport,
  onExportSplit,
  isCopied,
  isExporting,
  maxFileSizeKB,
  onMaxFileSizeChange,
  secretsCount = 0,
}) => {
  const stepIdx = FILE_SIZE_STEPS_KB.indexOf(maxFileSizeKB);
  const currentStepIndex = stepIdx >= 0 ? stepIdx : 3; // Default 100 KB
  const payload = splitPayloadSize(selectedSizeBytes);

  return (
    <div className="flex flex-col gap-3.5 shrink-0 select-none">
      {/* Top Statistics: 3 Cutout Index Cards with Pinned Washi Tape */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {/* Stat 1: Selected Files Card */}
        <div className="relative bg-craft-850 border-2 border-craft-700 p-3.5 rounded-xl shadow-brutal flex flex-col justify-between transition-transform hover:-translate-y-0.5">
          <div className="absolute -top-2 left-6 w-10 h-3 washi-tape-lilac rotate-[-4deg] rounded-sm pointer-events-none" />
          <div className="flex items-center justify-between text-craft-400 mb-1">
            <span className="text-xs font-sketch tracking-wide text-craft-300">Selected Files</span>
            <svg className="w-4 h-4 text-neon-lilac" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black font-mono text-stone-100" id="stat-selected-count">
              {selectedCount}
            </span>
            <span className="text-xs font-mono text-craft-500 font-bold">/ {totalCount}</span>
          </div>
        </div>

        {/* Stat 2: Payload Size Card */}
        <div className="relative bg-craft-850 border-2 border-craft-700 p-3.5 rounded-xl shadow-brutal flex flex-col justify-between transition-transform hover:-translate-y-0.5">
          <div className="absolute -top-2 left-8 w-12 h-3 washi-tape-mint rotate-[3deg] rounded-sm pointer-events-none" />
          <div className="flex items-center justify-between text-craft-400 mb-1">
            <span className="text-xs font-sketch tracking-wide text-craft-300">Payload Size</span>
            <svg className="w-4 h-4 text-neon-mint" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path
                d="M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7c0-2-1-3-3-3H7C5 4 4 5 4 7zm0 4h16"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black font-mono text-neon-mint" id="stat-payload-size">
              {payload.value}
            </span>
            <span className="text-xs font-mono text-neon-mint/80 font-bold">{payload.unit}</span>
          </div>
        </div>

        {/* Stat 3: Est. Tokens Card */}
        <div className="relative bg-craft-850 border-2 border-craft-700 p-3.5 rounded-xl shadow-brutal flex flex-col justify-between transition-transform hover:-translate-y-0.5">
          <div className="absolute -top-2 left-6 w-11 h-3 washi-tape-yellow rotate-[-2deg] rounded-sm pointer-events-none" />
          <div className="flex items-center justify-between text-craft-400 mb-1">
            <span className="text-xs font-sketch tracking-wide text-craft-300">Est. Tokens</span>
            <svg className="w-4 h-4 text-neon-yellow" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path
                d="M9 3v2m6-2v2M9 19v2m6-2v2M3 9h2m-2 6h2m14-6h2m-2 6h2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black font-mono text-neon-yellow" id="stat-est-tokens">
              {estimatedTokens.toLocaleString()}
            </span>
            <span className="text-xs font-mono text-craft-500 font-bold">tok</span>
          </div>
        </div>
      </div>

      {/* High Payload Warning Banner (Web Chat Truncation Risk) */}
      {selectedSizeBytes > 700 * 1024 && (
        <div className="bg-amber-950/70 border-2 border-amber-500/60 rounded-xl px-4 py-2 flex items-center justify-between flex-wrap gap-2 text-xs font-mono text-amber-200 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-base text-amber-400">⚠️</span>
            <span>
              <strong>Payload Warning ({payload.value} {payload.unit}):</strong> Web chats (ChatGPT, Claude, Gemini Web) frequently truncate pasted text &gt;700 KB silently.
            </span>
          </div>
          <span className="text-[11px] text-amber-300 font-bold bg-amber-900/60 px-2 py-0.5 rounded border border-amber-600/50">
            Recommend: Enable Diet Mode or Export Split
          </span>
        </div>
      )}

      {/* Context Options Bar (Format Tabs, Max Size Slider, Action Buttons) */}
      <div className="bg-craft-850/90 border-2 border-craft-700/90 p-3 rounded-xl flex flex-wrap items-center justify-between gap-3 shadow-sm">
        {/* Format Tabs & Slider */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Format Tabs */}
          <div className="flex items-center bg-craft-950 p-1 rounded-lg border border-craft-750" id="format-tab-group">
            <button
              type="button"
              onClick={() => onFormatChange('xml')}
              className={`format-tab px-3 py-1 text-xs font-mono rounded-md transition-all cursor-pointer ${
                format === 'xml'
                  ? 'bg-neon-lilac text-craft-950 font-bold shadow-sm'
                  : 'text-craft-400 font-medium hover:text-white'
              }`}
            >
              &lt;/&gt; XML
            </button>
            <button
              type="button"
              onClick={() => onFormatChange('markdown')}
              className={`format-tab px-3 py-1 text-xs font-mono rounded-md transition-all cursor-pointer ${
                format === 'markdown'
                  ? 'bg-neon-lilac text-craft-950 font-bold shadow-sm'
                  : 'text-craft-400 font-medium hover:text-white'
              }`}
            >
              Markdown
            </button>
            <button
              type="button"
              onClick={() => onFormatChange('plain')}
              className={`format-tab px-3 py-1 text-xs font-mono rounded-md transition-all cursor-pointer ${
                format === 'plain'
                  ? 'bg-neon-lilac text-craft-950 font-bold shadow-sm'
                  : 'text-craft-400 font-medium hover:text-white'
              }`}
            >
              Plain
            </button>
          </div>

          {/* Max Size Interactive Slider */}
          <div className="flex items-center gap-2.5 bg-craft-950/80 px-3 py-1.5 rounded-lg border border-craft-750">
            <span className="text-xs font-sketch text-craft-300 flex items-center gap-1">
              <span>📏</span>
              <span>Max Size:</span>
            </span>
            <input
              type="range"
              min={0}
              max={FILE_SIZE_STEPS_KB.length - 1}
              step={1}
              value={currentStepIndex}
              onChange={(e) => {
                const targetKb = FILE_SIZE_STEPS_KB[Number(e.target.value)];
                onMaxFileSizeChange(targetKb);
              }}
              className="w-24 sm:w-28 cursor-pointer"
              id="size-range-slider"
            />
            <span
              className="px-2 py-0.5 text-xs font-mono font-bold bg-craft-800 text-neon-lilac border border-craft-700 rounded-md min-w-[58px] text-center"
              id="slider-size-badge"
            >
              {formatSizeStep(maxFileSizeKB)}
            </span>
          </div>

          {/* Secrets indicator if any found */}
          {secretsCount > 0 && (
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold bg-neon-coral/15 text-neon-coral border border-neon-coral/40"
              title="Secrets detected in selected codebase. Mask Secrets is active."
            >
              <span>🛡️</span>
              <span>{secretsCount} Secrets</span>
            </div>
          )}
        </div>

        {/* Primary Actions (Copy Context & Export) */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Copy Context Tactile Button */}
          <button
            type="button"
            onClick={onCopy}
            disabled={selectedCount === 0}
            className={`relative px-4 py-1.5 font-extrabold text-xs rounded-xl border-2 border-craft-950 shadow-brutal hover:shadow-brutal-hover hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50 ${
              isCopied ? 'bg-neon-mint text-craft-950' : 'bg-neon-lilac hover:bg-purple-300 text-craft-950'
            }`}
            id="btn-copy-context"
          >
            {isCopied ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                  <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span id="btn-copy-context-label">Copied to Clipboard! ✨</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path
                    d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span id="btn-copy-context-label">Copy Context</span>
              </>
            )}
          </button>

          {/* Export Button */}
          <button
            type="button"
            onClick={onExport}
            disabled={selectedCount === 0 || isExporting}
            className="px-3.5 py-1.5 bg-craft-800 hover:bg-craft-750 text-stone-200 font-bold text-xs rounded-xl border-2 border-craft-700 shadow-brutal-sm hover:translate-x-0.5 hover:translate-y-0.5 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            id="btn-export"
          >
            <svg className="w-3.5 h-3.5 text-neon-yellow" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>{isExporting ? 'Exporting…' : 'Export'}</span>
          </button>

          {/* Export Split Button when payload is large (> 450 KB) */}
          {selectedSizeBytes > 450 * 1024 && onExportSplit && (
            <button
              type="button"
              onClick={onExportSplit}
              disabled={selectedCount === 0 || isExporting}
              className="px-3.5 py-1.5 bg-craft-800 hover:bg-craft-750 text-neon-yellow font-bold text-xs rounded-xl border-2 border-neon-yellow/70 shadow-brutal-sm hover:translate-x-0.5 hover:translate-y-0.5 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Split codebase into multiple safe parts (< 450 KB each) with manifest linkers"
              id="btn-export-split"
            >
              <span>Export Split</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
