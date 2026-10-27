import React from 'react';

interface PreviewPanelProps {
  content: string;
  includeAsciiTree: boolean;
  onToggleAsciiTree: (val: boolean) => void;
  isLoadingPreview: boolean;
  redactSecrets?: boolean;
  onToggleRedactSecrets?: (val: boolean) => void;
  secretsCount?: number;
}

export const PreviewPanel: React.FC<PreviewPanelProps> = ({
  content,
  includeAsciiTree,
  onToggleAsciiTree,
  isLoadingPreview,
  redactSecrets = true,
  onToggleRedactSecrets,
  secretsCount = 0,
}) => {
  const lineCount = content ? content.split('\n').length : 0;
  const charCount = content ? content.length : 0;

  return (
    <div className="flex-1 bg-craft-950 border-2 border-craft-700/80 rounded-xl overflow-hidden flex flex-col relative shadow-inner min-h-0">
      {/* Live Preview Card Header */}
      <div className="bg-craft-850 px-4 py-2.5 border-b-2 border-craft-700 flex items-center justify-between flex-wrap gap-2 shrink-0 select-none">
        <div className="flex items-center gap-2">
          <span className="text-neon-lilac">👁️</span>
          <h2 className="text-xs font-bold font-mono tracking-wide text-stone-200 uppercase">
            Context Live Preview
          </h2>
          <span className="w-2 h-2 rounded-full bg-neon-mint animate-pulse" title="Live Sync Active" />
        </div>

        {/* Toggles: Mask Secrets & ASCII Tree */}
        <div className="flex items-center gap-3">
          {/* Mask Secrets Badge Toggle */}
          {onToggleRedactSecrets && (
            <label
              className="flex items-center gap-1.5 cursor-pointer bg-craft-950 px-2.5 py-1 rounded-md border border-craft-750 hover:border-craft-600 transition-colors"
              title={redactSecrets ? 'Auto-masking secrets & API tokens' : 'Secrets masking disabled'}
            >
              <input
                type="checkbox"
                checked={redactSecrets}
                onChange={(e) => onToggleRedactSecrets(e.target.checked)}
                className="rounded text-neon-mint focus:ring-0 w-3.5 h-3.5 bg-craft-850 border-craft-600 cursor-pointer"
                id="toggle-mask-secrets"
              />
              <span className="text-[11px] font-mono text-neon-mint flex items-center gap-1 font-semibold select-none">
                <span>🛡️</span>
                <span>Mask Secrets</span>
              </span>
              {secretsCount > 0 && (
                <span className="text-[10px] px-1 py-0.2 rounded bg-neon-coral/20 text-neon-coral font-mono font-bold">
                  {secretsCount}
                </span>
              )}
            </label>
          )}

          {/* ASCII Tree Toggle */}
          <label
            className="flex items-center gap-1.5 cursor-pointer bg-craft-950 px-2 py-1 rounded-md border border-craft-750 hover:border-craft-600 transition-colors"
            title="Include ASCII directory tree in merged context"
          >
            <input
              type="checkbox"
              checked={includeAsciiTree}
              onChange={(e) => onToggleAsciiTree(e.target.checked)}
              className="rounded text-neon-lilac focus:ring-0 w-3.5 h-3.5 bg-craft-850 border-craft-600 cursor-pointer"
              id="toggle-ascii-tree"
            />
            <span className="text-[11px] font-mono text-stone-300 flex items-center gap-1 select-none">
              <span>🌲</span>
              <span>ASCII Tree</span>
            </span>
          </label>
        </div>
      </div>

      {/* Code View Area (Graph Paper Texture with Monospace Syntax Glow) */}
      <div
        className="notebook-grid flex-1 p-4 font-mono text-xs text-stone-300 overflow-y-auto leading-relaxed selection:bg-neon-lilac selection:text-craft-950 relative min-h-0"
        id="code-preview-scroll"
      >
        {isLoadingPreview ? (
          <div className="absolute inset-0 flex items-center justify-center bg-craft-950/60 backdrop-blur-xs">
            <div className="flex flex-col items-center gap-2">
              <div
                className="w-6 h-6 rounded-full animate-spin"
                style={{ border: '2.5px solid var(--craft-700)', borderTopColor: 'var(--neon-lilac)' }}
              />
              <span className="text-xs text-craft-500 font-mono">Generating live context…</span>
            </div>
          </div>
        ) : content ? (
          <textarea
            readOnly
            value={content}
            className="w-full h-full bg-transparent resize-none outline-none font-mono text-xs leading-relaxed text-stone-300 selection:bg-neon-lilac selection:text-craft-950 select-text cursor-text"
            spellCheck={false}
          />
        ) : (
          <div className="h-full flex flex-col items-center justify-center gap-3 p-8 text-center select-none">
            <div className="w-12 h-12 rounded-xl bg-craft-850 border-2 border-craft-700 flex items-center justify-center text-craft-500 shadow-brutal-sm">
              <span className="text-2xl">📁</span>
            </div>
            <p className="text-xs font-mono text-craft-500 max-w-[260px] leading-relaxed">
              Select files from the explorer tree on the left to generate merged LLM context
            </p>
          </div>
        )}
      </div>

      {/* Bottom Live Status Bar */}
      <footer className="bg-craft-900 border-t border-craft-800 px-4 py-1.5 flex items-center justify-between text-[11px] font-mono text-craft-400 shrink-0 select-none">
        <div className="flex items-center gap-3">
          <span>
            <strong className="text-stone-200">{lineCount.toLocaleString()}</strong> lines
          </span>
          <span className="text-craft-600">•</span>
          <span>
            <strong className="text-stone-200">{charCount.toLocaleString()}</strong> chars
          </span>
          <span className="text-craft-600">•</span>
          <span className="text-neon-mint font-semibold">Live Output Buffer</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-neon-yellow" />
          <span className="text-craft-500 font-sketch text-xs">UTF-8 • CRLF</span>
        </div>
      </footer>
    </div>
  );
};
