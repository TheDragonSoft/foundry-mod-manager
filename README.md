# Factorio Mod Manager

A modern, high-performance mod manager for **Factorio** built with **React**, **TypeScript**, **Tailwind CSS**, and **Express / Electron**, inspired by **r2modman**.

It integrates directly with the **official Factorio Mod Portal API** (`mods.factorio.com`) for browsing, searching, dependencies, and changelogs, while routing all downloads through the **re146 Cloudflare R2 storage mirror** (`https://mods-storage.re146.dev/`) so you can download mods without requiring official Factorio account login tokens.

---

## Key Features

- **r2modman-Style Profiles:**
  - Create, switch, clone, and delete isolated mod profiles (e.g. *Space Age Vanilla+*, *Krastorio 2*, *Ultracube*, *Multiplayer Session*).
  - Every profile keeps its own downloaded zip archives and isolated `mod-list.json`.
  - **Shareable Profile Codes:** Export any profile into a shareable string code (compressed JSON). Friends can paste the code to automatically download and configure the exact same mod list and versions!

- **Official Mod Portal Integration:**
  - Indexes 23,000+ Factorio mods from the official portal with local disk caching for instant search and filtering.
  - Search by mod name, title, author, summary, or keyword.
  - Filter by **Factorio version** (e.g. `2.0 (Space Age)` vs `1.1`), categories, and sort by most downloaded, top rated, or recently updated.
  - Rich mod details modal featuring complete Markdown descriptions, changelogs, release history, and dependency trees.

- **re146 High-Speed R2 Mirror Downloader:**
  - Downloads mod zip archives directly from `https://mods-storage.re146.dev/{name}/{version}.zip`.
  - Automatic retry, SHA1 verification, and real-time Server-Sent Events (SSE) progress tracking with speeds and percentage bars.

- **Smart Dependency Resolution:**
  - Automatically parses Factorio dependency rules (`base >= 2.0.0`, optional `?`, hidden `(?)`, incompatible `!`, and load order `~`).
  - When installing a mod, missing required dependencies are resolved and downloaded automatically in topological order.
  - Warns about conflicting or incompatible mods before launching.

- **Factorio Game Launcher Integration:**
  - **Start Modded:** Launches Factorio with `--mod-directory "<Profile_Folder>"` so Factorio loads cleanly with the active profile without altering your main game files.
  - **Start Vanilla:** Launches Factorio cleanly without mods.
  - **Sync to Game Directory:** Copies the active profile's mods and `mod-list.json` directly into `%APPDATA%\Factorio\mods`, so launching Factorio from Steam also runs your active profile.

---

## How to Run & Build

### Development Mode (Electron + Vite Hot Reload)
```bash
npm install
npm run dev
```

### Build Distribution Binaries (Windows Portable & Installer)
```bash
npm run electron:dist
```
This will compile the frontend with Vite and package the application using `electron-builder` into the `release/` directory:
- **Portable Executable:** `release/Foundry 1.0.0.exe`
- **Windows NSIS Installer:** `release/Foundry Setup 1.0.0.exe`
- **Unpacked Folder:** `release/win-unpacked/Foundry.exe`

---

## Project Architecture

```
Factorio Mod Manger/
├── server/
│   ├── services/
│   │   ├── dependencyService.ts   # Factorio dependency parser and semver resolver
│   │   ├── downloadService.ts     # re146 mirror streaming and recursive dependency downloader
│   │   ├── factorioService.ts     # Game path auto-detection, CLI args, sync to AppData
│   │   ├── modPortalService.ts    # Official portal catalog cache and search index
│   │   └── profileService.ts      # Profile isolation, mod-list.json manager, code sharing
│   └── index.ts                   # Express REST API & SSE real-time download stream
├── src/
│   ├── components/
│   │   ├── DownloadBar.tsx        # Floating real-time download progress bar
│   │   ├── InstalledView.tsx      # Installed mods list, toggles, updates
│   │   ├── ModDetailsModal.tsx    # Mod drawer with Markdown readme, changelog, dependencies
│   │   ├── OnlineView.tsx         # Mod portal catalog browser, search, filters
│   │   ├── ProfileModal.tsx       # Profile manager, code import/export
│   │   ├── SettingsModal.tsx      # Executable path, mirror URL, launch settings
│   │   └── Sidebar.tsx            # Profile switcher, launcher buttons, navigation
│   ├── services/
│   │   └── api.ts                 # Frontend API client
│   ├── types/
│   │   └── index.ts               # Shared TypeScript interfaces
│   ├── App.tsx                    # Main layout & view orchestrator
│   └── index.css                  # Factorio industrial dark theme
├── electron/
│   ├── main.ts                    # Electron window wrapper
│   └── preload.ts                 # Electron preload bridge
├── start.bat                      # 1-click Windows launcher
└── package.json
```
