import React, { useState, useRef, useEffect } from 'react';
import { Check } from 'lucide-react';

interface HeaderBarProps {
  currentPath: string | null;
  onOpenFolder: () => void;
  onOpenSettings: () => void;
  onRefresh?: () => void;
  isLoading: boolean;
  recentFolders?: string[];
  onSelectRecentFolder?: (path: string) => void;
  onClearRecentFolders?: () => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  currentPath,
  onOpenFolder,
  onOpenSettings,
  onRefresh,
  isLoading,
  recentFolders = [],
  onSelectRecentFolder,
  onClearRecentFolders,
}) => {
  const [copied, setCopied] = useState(false);
  const [isRecentOpen, setIsRecentOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsRecentOpen(false);
      }
    };
    if (isRecentOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isRecentOpen]);

  // Keyboard shortcut: Alt + R to toggle Recent Folders
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === 'r' || e.key === 'R')) {
        e.preventDefault();
        setIsRecentOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleCopyPath = () => {
    if (currentPath) {
      navigator.clipboard?.writeText(currentPath);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <header className="bg-craft-850 border-b-[2.5px] border-craft-700 px-5 py-3.5 flex flex-wrap items-center justify-between gap-4 relative shrink-0 select-none">
      {/* Left: Brand Logo & Title */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-neon-lilac/20 border-2 border-neon-lilac flex items-center justify-center text-neon-lilac shadow-brutal-sm rotate-[-3deg] hover:rotate-0 transition-transform shrink-0">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold tracking-tight text-stone-100 flex items-center gap-1.5">
              LocalIngest
            </h1>
            <span className="bg-neon-lilac text-craft-950 text-xs px-2 py-0.5 rounded font-black font-sketch tracking-wider rotate-[2deg] shadow-brutal-sm border border-craft-950">
              STUDIO
            </span>
          </div>
          <p className="text-xs text-craft-300 font-mono flex items-center gap-1">
            <span>Local Codebase-to-LLM Context Engine</span>
            <span className="text-neon-yellow font-sketch text-sm tracking-wide">~ ready ~</span>
          </p>
        </div>
      </div>

      {/* Right: Open Folder Tactile Button, Recent Folders & Path Display */}
      <div className="flex items-center flex-wrap gap-3">
        {/* Open Folder Tactile Cardboard Button */}
        <button
          type="button"
          onClick={onOpenFolder}
          disabled={isLoading}
          className="group relative px-4 py-2 bg-neon-lilac text-craft-950 font-bold rounded-xl border-2 border-craft-950 shadow-brutal hover:shadow-brutal-hover hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
          id="btn-open-folder"
        >
          {/* Corner tape accent */}
          <span className="absolute -top-1.5 -right-2 w-6 h-3 washi-tape-yellow rotate-12 opacity-90 pointer-events-none rounded-sm" />
          <span className="text-base group-hover:rotate-6 transition-transform">📂</span>
          <span className="text-sm font-extrabold">{isLoading ? 'Scanning…' : 'Open Folder'}</span>
        </button>

        {/* Recent Folders Dropdown */}
        <div className="relative inline-block z-50" ref={dropdownRef} id="recent-folders-dropdown-wrapper">
          <button
            type="button"
            onClick={() => setIsRecentOpen((prev) => !prev)}
            className="px-2.5 py-2 bg-craft-800 hover:bg-craft-750 text-craft-300 hover:text-white rounded-xl border-2 border-craft-700 shadow-brutal-sm hover:shadow-brutal-hover hover:translate-x-0.5 hover:translate-y-0.5 transition-all flex items-center gap-1.5 cursor-pointer"
            id="btn-recent-folders"
            title="Recent Folders History (Alt + R)"
          >
            <svg className="w-4 h-4 text-neon-lilac" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <svg
              className={`w-3.5 h-3.5 text-craft-500 transition-transform ${isRecentOpen ? 'rotate-180 text-neon-yellow' : ''}`}
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
            >
              <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {/* Opened State: Floating Kraft Memo Index Card Dropdown */}
          {isRecentOpen && (
            <div
              className="absolute left-0 mt-2.5 w-80 bg-craft-900 border-[2.5px] border-craft-700 rounded-xl shadow-2xl p-3.5 z-50 rotate-[-0.5deg]"
              id="recent-folders-menu"
              style={{ boxShadow: '5px 5px 0px #080706' }}
            >
              {/* Top Lilac Pinned Washi Tape Accent */}
              <div className="absolute -top-2.5 right-6 w-14 h-3.5 washi-tape-lilac rotate-[3deg] rounded-sm pointer-events-none z-50" />

              {/* Memo Header */}
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-dashed border-craft-700/80">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-sketch font-bold tracking-wide text-stone-200">Recent Folders</span>
                  <span className="px-1.5 py-0.2 text-[9px] font-mono font-bold bg-craft-800 text-neon-lilac rounded border border-craft-700">
                    {recentFolders.length}
                  </span>
                </div>
                {recentFolders.length > 0 && onClearRecentFolders && (
                  <button
                    type="button"
                    onClick={() => {
                      onClearRecentFolders();
                      setIsRecentOpen(false);
                    }}
                    className="text-[11px] font-sketch text-craft-500 hover:text-neon-coral flex items-center gap-1 transition-colors cursor-pointer"
                    title="Clear Recent History"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span>Clear</span>
                  </button>
                )}
              </div>

              {/* Recent Projects List */}
              <div className="space-y-1 max-h-[260px] overflow-y-auto pr-1">
                {recentFolders.length === 0 ? (
                  <div className="p-3 text-center text-xs font-mono text-craft-500">
                    No recent folders cached yet.
                  </div>
                ) : (
                  recentFolders.map((fPath) => {
                    const dirName = fPath.split(/[/\\]/).filter(Boolean).pop() || fPath;
                    const isActive = currentPath === fPath;
                    return (
                      <div
                        key={fPath}
                        onClick={() => {
                          onSelectRecentFolder?.(fPath);
                          setIsRecentOpen(false);
                        }}
                        className={`p-2 rounded-lg cursor-pointer transition-colors ${
                          isActive
                            ? 'bg-craft-850 border border-neon-lilac/80 shadow-sm relative group hover:bg-craft-800'
                            : 'hover:bg-craft-800/80 border border-transparent hover:border-craft-700 group'
                        }`}
                        title={fPath}
                      >
                        <div className="flex items-start justify-between gap-1.5">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-neon-yellow text-sm shrink-0">📁</span>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <span
                                  className={`font-mono text-xs truncate ${
                                    isActive ? 'font-bold text-white' : 'font-semibold text-stone-200 group-hover:text-white'
                                  }`}
                                >
                                  {dirName}
                                </span>
                                {isActive && (
                                  <span className="px-1.5 py-0.2 text-[9px] font-mono font-bold bg-neon-lilac text-craft-950 rounded shadow-brutal-sm">
                                    Active
                                  </span>
                                )}
                              </div>
                              <p
                                className={`text-[10px] font-mono truncate mt-0.5 ${
                                  isActive ? 'text-stone-400' : 'text-craft-500 group-hover:text-craft-400'
                                }`}
                              >
                                {fPath}
                              </p>
                            </div>
                          </div>
                          {isActive && (
                            <span
                              className="w-1.5 h-1.5 rounded-full bg-neon-mint mt-1.5 shrink-0 animate-pulse"
                              title="Current Workspace"
                            />
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Quick Action Footer Link */}
              <div className="mt-2 pt-2 border-t border-dashed border-craft-750 flex items-center justify-between text-[11px] font-sketch">
                <button
                  type="button"
                  onClick={() => {
                    setIsRecentOpen(false);
                    onOpenFolder();
                  }}
                  className="text-neon-lilac hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <span>+ Choose other directory...</span>
                </button>
                <span className="text-craft-500 font-mono text-[9px]">Alt + R</span>
              </div>
            </div>
          )}
        </div>

        {/* Current Workspace Folder Path Bar */}
        <div className="flex items-center bg-craft-950 border-2 border-craft-750 px-3.5 py-1.5 rounded-xl shadow-inner gap-2 max-w-md">
          <span className="text-craft-500 font-sketch text-sm">📁</span>
          <span
            className={`text-xs font-mono truncate max-w-[260px] select-all ${
              currentPath ? 'text-neon-yellow' : 'text-craft-500 italic'
            }`}
            id="current-folder-path"
            title={currentPath || 'No repository selected'}
          >
            {currentPath || 'No repository selected'}
          </span>
          {currentPath && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleCopyPath}
                className="text-craft-500 hover:text-stone-200 transition-colors p-1 hover:bg-craft-800 rounded cursor-pointer"
                id="btn-copy-path"
                title="Copy Folder Path"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-neon-mint" />
                ) : (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Tactile Rescan / Refresh Button */}
        {currentPath && onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            className="w-9 h-9 rounded-xl bg-craft-800 hover:bg-craft-750 border-2 border-craft-700 flex items-center justify-center text-craft-300 hover:text-white shadow-brutal-sm hover:shadow-brutal-hover hover:translate-x-0.5 hover:translate-y-0.5 transition-all cursor-pointer disabled:opacity-50 group"
            id="btn-refresh-project"
            title="Refresh & Rescan Project (F5 / Ctrl+R)"
          >
            <svg
              className={`w-4 h-4 text-neon-mint ${
                isLoading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'
              }`}
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
            >
              <path
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}

        {/* Global Settings Gear Button */}
        <button
          type="button"
          onClick={onOpenSettings}
          className="w-9 h-9 rounded-xl bg-craft-800 hover:bg-craft-750 border-2 border-craft-700 flex items-center justify-center text-craft-300 hover:text-white shadow-brutal-sm hover:shadow-brutal-hover hover:translate-x-0.5 hover:translate-y-0.5 transition-all cursor-pointer"
          title="Scanner Settings"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </header>
  );
};
