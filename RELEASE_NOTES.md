# LocalIngest Studio — Release Notes

## Version 1.0.0 (Craft Cardboard & Neon Highlighter)

LocalIngest Studio is a local codebase-to-LLM context extraction engine designed to turn your project repository into clean, structured XML, Markdown, or Plain Text prompts for Google Gemini, Claude, and GPT-4o.

---

### Highlights & Key Features:

- **Multi-Platform Desktop (Windows & Linux AppImage)**:
  - Windows: Zero-installation, self-contained single executable (`LocalIngest-Studio-Portable-v1.0.0.exe`, ~107MB) and one-click setup installer.
  - Linux: Clean, standalone `.AppImage` (`LocalIngest-Studio-Linux-v1.0.0.AppImage`) without complex package dependencies or tarball extraction.

- **Craft Cardboard & Neon Highlighter Aesthetic**:
  - Immersive craft cardboard dark palette (`#0e0d0c` kraft base with texture dots).
  - Tactile striped washi tape tags, brutalist zero-blur marker shadows, and hand-sketched organic borders.
  - Interactive felt-tip marker slider for file size filtering and fluorescent highlighter indicators.

- **Interactive 3-State Checkbox File Tree**:
  - Full tri-state (checked, unchecked, partial/indeterminate) recursive directory selection.
  - Quick-filter extension pills (`.ts`, `.tsx`, `.json`, `.css`, `-Tests`).
  - **Git-Aware Selection**: One-click selection for modified or unstaged files (`git status --porcelain`).

- **Security & Secret Redaction (Zero-Leak)**:
  - Built-in real-time secret scanner detecting API keys (OpenAI, Anthropic, HuggingFace, GitHub, AWS, Slack, Private Keys, JWTs).
  - Automated `[REDACTED_SECRET: TYPE]` mask to protect credentials before copying to AI prompts.

- **GitIngest-Style Discrete Max File Size Threshold**:
  - Stepped limits from 10 KB, 20 KB, 50 KB, 100 KB up to 100 MB and Unlimited.
  - Large assets or binaries automatically excluded with a sticker warning badge (`>100KB`).

- **Persistent Recent Folders Cache & Dropdown**:
  - Automatically caches recently opened project directories locally across application restarts.
  - Tactile dropdown menu right next to "Open Folder" featuring craft memo styling, washi tape accent, folder badges, and one-click history clearing.

- **Instant Codebase Rescan & Refresh (F5 / Ctrl+R)**:
  - Added tactile refresh buttons on both the top header bar and file tree action strip.
  - Automatically purges cached file contents on refresh so disk modifications and Git changes re-sync immediately without application restarts or window reload flickers.

- **Security & Path Traversal Hardening**:
  - Strict path boundary verification in recursive scanner service to eliminate directory traversal risks and ensure 100% clean static analysis (Grade A on Codacy).

- **Real-Time Token Counter**:
  - Accurate local tokenizer calculation using `js-tiktoken` (cl100k_base / o200k_base).
  - Instant Est. Tokens counter with color thresholds (Mint `<32k`, Yellow `<128k`, Coral `>128k`).

---

### Downloads:

- **`LocalIngest-Studio-Portable-v1.0.0.exe` (~107MB) [Windows Portable]**: Standalone single-file executable for Windows 10/11. No installer needed.
- **`LocalIngest-Studio-Setup-v1.0.0.exe` (~125MB) [Windows Setup]**: One-click setup installer with Windows Start Menu and Desktop shortcuts.
- **`LocalIngest-Studio-Linux-v1.0.0.AppImage` (~105MB) [Linux Portable]**: Standalone single-file AppImage for modern Linux distributions (Ubuntu, Debian, Fedora, Arch Linux). Just `chmod +x` and run.

