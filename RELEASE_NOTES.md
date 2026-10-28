# LocalIngest Studio — Release Notes

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

### Downloads (v1.0.1):

- **`LocalIngest-Studio-Portable-v1.0.1.exe` (~109 MB)**: Standalone portable version for Windows 10/11. No installation required.
- **`LocalIngest-Studio-Setup-v1.0.1.exe` (~127 MB)**: Standard Windows installer with desktop and start menu shortcuts.
- **`LocalIngest-Studio-Linux-v1.0.1.AppImage` (~105 MB)**: Standalone single-file executable for Linux.


