import React, { useState } from 'react';
import { X, Plus, Trash2, Sliders, ShieldCheck, HardDrive } from 'lucide-react';
import type { ScanOptions } from '../types/index.ts';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  options: ScanOptions;
  onOptionsChange: (newOptions: ScanOptions) => void;
  onApplyAndRescan: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen, onClose, options, onOptionsChange, onApplyAndRescan,
}) => {
  const [newRule, setNewRule] = useState('');
  if (!isOpen) return null;

  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newRule.trim();
    if (!trimmed) return;
    const current = options.customIgnoreRules || [];
    if (!current.includes(trimmed)) {
      onOptionsChange({ ...options, customIgnoreRules: [...current, trimmed] });
    }
    setNewRule('');
  };

  const handleRemoveRule = (rule: string) => {
    const current = options.customIgnoreRules || [];
    onOptionsChange({ ...options, customIgnoreRules: current.filter(r => r !== rule) });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(3px)' }}>
      <div
        className="w-full max-w-md overflow-hidden flex flex-col wobbly-box"
        style={{
          background: 'var(--craft-900)',
          border: '2.5px solid var(--craft-700)',
          boxShadow: 'var(--shadow-brutal-lg)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ background: 'var(--craft-850)', borderBottom: '2px solid var(--craft-700)' }}
        >
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center shadow-brutal-sm"
              style={{ background: 'rgba(192, 132, 252, 0.2)', border: '1.5px solid var(--neon-lilac)' }}
            >
              <Sliders className="w-4 h-4 text-purple-300" />
            </div>
            <span className="text-[13px] font-bold font-sketch text-stone-100">Scanner & Ignore Settings</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center rounded-md text-stone-500 hover:text-stone-200 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4">
          {/* Gitignore toggle */}
          <div
            className="flex items-center justify-between p-3 rounded-xl"
            style={{ background: 'var(--craft-850)', border: '1.5px solid var(--craft-750)' }}
          >
            <div className="flex items-center gap-2.5">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 shadow-brutal-sm"
                style={{ background: 'rgba(74, 222, 128, 0.15)', border: '1.5px solid var(--neon-mint)' }}
              >
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-[12.5px] font-semibold text-stone-200">Respect .gitignore</p>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  Auto-exclude files matching project's .gitignore
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={options.respectGitignore !== false}
              onChange={e => onOptionsChange({ ...options, respectGitignore: e.target.checked })}
              className="tree-checkbox"
            />
          </div>

          {/* Max File Size Setting */}
          <div
            className="flex items-center justify-between p-3 rounded-xl"
            style={{ background: 'var(--craft-850)', border: '1.5px solid var(--craft-750)' }}
          >
            <div className="flex items-center gap-2.5">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 shadow-brutal-sm"
                style={{ background: 'rgba(250, 204, 21, 0.15)', border: '1.5px solid var(--neon-yellow)' }}
              >
                <HardDrive className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <p className="text-[12.5px] font-semibold text-stone-200">Default Max File Size</p>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  Limit in KB (0 = Unlimited)
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min="0"
                step="50"
                value={options.maxFileSizeKB ?? 100}
                onChange={e => onOptionsChange({ ...options, maxFileSizeKB: parseInt(e.target.value, 10) || 0 })}
                className="w-20 px-2 py-1 rounded-lg text-right font-mono text-[12px] text-amber-300 outline-none"
                style={{ background: 'var(--craft-950)', border: '1.5px solid var(--craft-750)' }}
              />
              <span className="text-[11px] font-mono text-stone-500">KB</span>
            </div>
          </div>

          {/* Custom patterns */}
          <div className="space-y-2">
            <div>
              <p className="text-[12.5px] font-semibold text-stone-200">Custom Ignore Patterns</p>
              <p className="text-[11px] text-stone-500 mt-0.5">
                Add globs to exclude, e.g. <code className="text-purple-300 font-mono">*.log</code>, <code className="text-purple-300 font-mono">secrets/</code>
              </p>
            </div>

            <form onSubmit={handleAddRule} className="flex gap-2">
              <input
                type="text"
                placeholder="*.tmp, docs/legacy"
                value={newRule}
                onChange={e => setNewRule(e.target.value)}
                className="flex-1 px-3 py-1.5 rounded-lg text-[12px] font-mono text-stone-200 outline-none"
                style={{
                  background: 'var(--craft-950)',
                  border: '1.5px solid var(--craft-750)',
                }}
              />
              <button
                type="submit"
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[12px] font-bold text-stone-950 cursor-pointer shadow-brutal-sm"
                style={{ background: 'var(--neon-lilac)', border: '1.5px solid var(--ink-black)' }}
              >
                <Plus className="w-3.5 h-3.5" />
                Add
              </button>
            </form>

            <div className="max-h-32 overflow-y-auto space-y-1">
              {(options.customIgnoreRules || []).length > 0 ? (
                (options.customIgnoreRules || []).map(rule => (
                  <div
                    key={rule}
                    className="flex items-center justify-between px-2.5 py-1.5 rounded-lg"
                    style={{ background: 'var(--craft-850)', border: '1px solid var(--craft-750)' }}
                  >
                    <span className="text-[11.5px] font-mono text-purple-300">{rule}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveRule(rule)}
                      className="text-stone-500 hover:text-rose-400 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-center py-2 text-[11px] text-stone-600 font-mono italic">
                  No custom rules. Defaults are active.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-end gap-2 px-4 py-3"
          style={{ background: 'var(--craft-850)', borderTop: '2px solid var(--craft-700)' }}
        >
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg text-[12px] text-stone-400 hover:text-stone-200 cursor-pointer font-medium"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => { onApplyAndRescan(); onClose(); }}
            className="px-4 py-1.5 rounded-lg text-[12px] font-bold text-stone-950 cursor-pointer shadow-brutal-sm"
            style={{
              background: 'var(--neon-lilac)',
              border: '2px solid var(--ink-black)',
            }}
          >
            Apply & Rescan
          </button>
        </div>
      </div>
    </div>
  );
};
