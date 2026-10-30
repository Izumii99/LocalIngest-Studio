# LocalIngest Studio — Release Notes

## Version 1.0.3

This major release introduces the **Diet Ingest Engine**, **Modular Multi-Part Split Ingest**, **Web Chat Truncation Warnings**, and **Atomic Disk Flush Safety** to eliminate silent payload truncation by web browsers (ChatGPT, Claude, and Gemini Web) when working with large codebases.

### What's New & Fixed:

- **Diet Ingest Mode (Smart Asset & Inline SVG / Base64 Pruning)**:
  - Automatically prunes heavy inline SVGs and large Base64 data URIs into concise placeholders (`<svg><!-- [LocalIngest: SVG body omitted, XX KB saved] --></svg>` and `data:...[OMITTED_BY_LOCALINGEST_XXKB]`).
  - Reduces payload size by 30% to 60% without losing programmatic code logic or breaking syntax, preserving web chat transport limits.
  - Toggleable via the "Diet Mode" header badge (persisted across sessions).

- **Modular Multi-Part Split Ingest (`Export Split`)**:
  - Automatically partitions large codebases into connected, safe chunks (< 450 KB each) whenever payload exceeds the safety threshold.
  - Injects a manifest linker header (`<ingest_metadata>` in XML, blockquotes in Markdown) linking Part 1, Part 2, etc., allowing the AI assistant to track continuations seamlessly across multiple prompts.

- **Real-Time Web Chat Truncation Warning**:
  - Displays a high-visibility amber warning banner whenever the payload exceeds 700 KB, alerting developers that browser web chats silently truncate large pastes.
  - Suggests turning on Diet Mode or using the new Split Export feature.

- **One-Click Ignore Presets (`-CI` & `-Linters`)**:
  - Added `-CI` button to instantly deselect `.github/**`, `.circleci/**`, `.gitlab-ci.yml`, and `azure-pipelines.yml`.
  - Added `-Linters` button to deselect `.editorconfig`, `.eslintrc*`, `.prettierrc*`, `.codacy.yml`, and `tsconfig*.json`.
  - Selections automatically persist in the per-project cache.

- **Atomic Disk Flush Safety**:
  - Enhanced file export routines with atomic file descriptor synchronization (`fsync`) to guarantee 100% complete disk buffer flushes before returning success, preventing premature write truncation.

---

## Version 1.0.2

This release introduces smart per-project file selection caching, remembers your last directory position in the folder picker, and streamlines the interface with a cleaner, distraction-free aesthetic.

### What's New & Fixed:

- **Per-Project File Selection Cache**:
  - The files and folders you select in the left explorer are now cached per project.
  - Refreshing your project (`F5` / `Ctrl+R`), switching between multiple repositories, or restarting the application now restores your exact file selections automatically.
  - Unchecking all items or selecting custom subsets stays saved without resetting back to "select all".

- **Folder Picker Remembers Last Directory**:
  - Clicking "Open Folder" now remembers the last opened directory position as its initial browsing path instead of resetting to the system default root or Desktop.

- **Universal Setup Wizard & Interactive Uninstaller**:
  - `LocalIngest-Studio-Setup-v1.0.2.exe` now features a standard interactive setup wizard:
    - Choose your custom installation folder or use the default location.
    - Option to create Desktop and Start Menu shortcuts.
  - The uninstaller now includes an explicit confirmation step ("Are you sure you want to uninstall?") followed by an animated deletion progress bar.

- **Clean & Minimalist Interface Polish**:
  - Removed decorative icons across the Live Preview header, ASCII Tree toggle, and explorer footer to deliver a clean, professional senior developer visual aesthetic.

---

## Version 1.0.1

This update improves reliability and saves your settings between sessions so you can jump right back into your workflow without reconfiguring.

### What's New & Fixed:

- **Recent Folders Now Stay Saved After Closing the App**:
  - Fixed an issue where previously opened folders would disappear from the "Recent Folders" list after closing the app.
  - Your history now saves reliably across all versions: Windows Portable (`.exe`), Windows Installer (`setup.exe`), and Linux (`.AppImage`).

- **Remember Last Used File Size Limit**:
  - The Max File Size filter now remembers your last setting.
  - If you change the limit to `1 MB`, `500 KB`, or `Unlimited`, the app will open with that same limit next time. Fresh installs start with a sensible `100 KB` default.

---

## Version 1.0.0 (Initial Release)

LocalIngest Studio is a fast, offline desktop app that packages your local code into clean, organized prompts for AI assistants like Google Gemini, Claude, and ChatGPT.

### Highlights:

- **Ready to Run on Windows & Linux**:
  - Download and run immediately without setup using the portable `.exe` on Windows or `.AppImage` on Linux. A standard installer is also available.
- **Craft Paper & Dark Mode Interface**:
  - Designed with an eye-friendly dark craft palette, subtle highlighter accents, and clear typography.
- **Interactive File Explorer**:
  - Check or uncheck folders with automatic sub-item selection.
  - Quick-filter buttons to include or exclude specific file types (like `.ts`, `.json`, `.css`, or test files).
- **Git-Aware Selection**:
  - Select only files you've recently modified or added with a single click.
- **Automatic Secret Redaction**:
  - Automatically detects and hides sensitive items like API keys and private tokens before you copy code to an AI prompt.
- **Smart File Size Filtering**:
  - Easily exclude oversized files or media with an adjustable slider so your prompts stay compact.
- **Built-in Token Counter**:
  - See estimated AI token counts in real time before copying or exporting your project.
- **One-Click Refresh (F5 / Ctrl+R)**:
  - Quickly re-scan your project to pick up newly saved files without restarting the app.

---

### Downloads (v1.0.3):

- **`LocalIngest-Studio-Portable-v1.0.3.exe` (~109 MB)**: Standalone portable version for Windows 10/11. No installation required.
- **`LocalIngest-Studio-Setup-v1.0.3.exe` (~127 MB)**: Standard Windows installer with desktop and start menu shortcuts.
- **`LocalIngest-Studio-Linux-v1.0.3.AppImage` (~105 MB)**: Standalone single-file executable for Linux.
