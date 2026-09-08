# Factorio Mod Manager (r2modman-style) Implementation Plan

Build a dedicated, high-performance Factorio Mod Manager inspired by **r2modman**. It pulls mod listings, search metadata, descriptions, changelogs, and dependency specifications directly from the **official Factorio Mod Portal API** (`mods.factorio.com`), while routing all mod archive downloads through the **re146 Cloudflare R2 storage mirror** (`https://mods-storage.re146.dev/`) to bypass official authentication requirements.

---

## User Review Required

> [!IMPORTANT]
> **Detected Local Factorio Installation:**
> During research, we detected:
> - **Game Executable:** `D:\Games\Factorio\bin\x64\factorio.exe` (Factorio 2.0.72 Space Age)
> - **Game Data Path:** `C:\Users\ANXOMXR\AppData\Roaming\Factorio`
> - **Active Mod List:** `C:\Users\ANXOMXR\AppData\Roaming\Factorio\mods\mod-list.json`
> The manager will auto-configure these paths while allowing custom paths in Settings.

> [!IMPORTANT]
> **Technology Stack:**
> We propose building this as a **Modern Desktop Application** using **Electron + Vite + React + TypeScript + Tailwind CSS** (with Lucide icons).
> - Why? Node.js `v26.7.0` and `npm 11.19.0` are installed on your machine. Electron matches `r2modman`'s native desktop feel, providing native file management, process spawning (`factorio.exe --mod-directory`), folder pickers, and desktop notifications, with fallback local web server support.

---

## Key Features & Architecture

```
                                  ┌────────────────────────────────┐
                                  │      Official Mod Portal       │
                                  │    (mods.factorio.com/api)     │
                                  └───────────────┬────────────────┘
                                                  │ Mod Catalog, Details,
                                                  │ Dependencies, Changelogs
                                                  ▼
┌───────────────────────────┐     ┌────────────────────────────────┐
│   Factorio Mod Manager    │◄───►│       Local Core Engine        │
│    (r2modman-style UI)    │     │  (Profiles, Dependencies, CLI) │
└───────────────────────────┘     └───────────────┬────────────────┘
                                                  │ Direct Zip Download
                                                  ▼
                                  ┌────────────────────────────────┐
                                  │        re146 R2 Mirror         │
                                  │   (mods-storage.re146.dev)     │
                                  └────────────────────────────────┘
```

### 1. Profiles System (r2modman-style)
- **Multi-Profile Isolation:** Create profiles like *"Space Age Vanilla+"*, *"Krastorio 2"*, *"Ultracube"*, *"Multiplayer Session"*.
- **Per-Profile Mod Directory:** Each profile keeps its own downloaded zips and `mod-list.json`.
- **Profile Code Sharing:** Export any profile into a shareable string code (compressed JSON) or `.fmmprofile` file. Friends can paste the code to automatically download and configure the exact same mod list and versions!
- **One-Click Switch:** Instantly switch between profiles without touching or corrupting game saves.

### 2. Mod Portal Integration & re146 Mirror Downloader
- **Official Mod Portal Metadata:**
  - Queries `https://mods.factorio.com/api/mods?page_size=max` to cache the full index locally (~3.2 MB) for instant, latency-free search and filtering.
  - Queries `https://mods.factorio.com/api/mods/{name}/full` for rich mod information (README markdown, screenshots, changelogs, full release history).
  - Fallback proxy: `https://re146.dev/factorio/mods/modinfo?id={name}`.
- **re146 Mirror Download Engine:**
  - Downloads mod zips directly from `https://mods-storage.re146.dev/{name}/{version}.zip`.
  - Automatic retry and SHA1 checksum verification against Portal release data.
  - Concurrent download queue with pause/resume and live progress bars.

### 3. Smart Dependency Management & Conflict Detection
- **Dependency Parser:** Supports Factorio dependency syntax:
  - `""` / `"="` / `"=="` (Required dependency, e.g. `flib >= 0.15.0`)
  - `"?"` / `"(?)"` (Optional dependency)
  - `"!"` (Incompatible mod: flags conflicts in red)
  - `"~"` (Load order dependency)
- **Auto-Resolve:** When installing a mod, inspects required dependencies and automatically downloads missing dependencies in topological order.
- **Incompatibility Warnings:** Warns if an installed mod conflicts with another enabled mod.

### 4. Installed Mods Manager
- **Toggle Switches:** Enable/disable mods instantly (updates profile `mod-list.json`).
- **Version Switching:** Dropdown to roll back or upgrade any mod to any available version on the portal.
- **Update Checks:** "Check Updates" button with batch "Update All" or per-mod updates.
- **Clean Uninstall:** Deletes mod zip and updates `mod-list.json` with an option to clean up unused orphaned dependencies.

### 5. Game Launcher Integration
- **"Start Modded" Button:** Launches `factorio.exe --mod-directory "<Profile_Folder>"` so Factorio loads cleanly with the active profile.
- **"Start Vanilla" Button:** Launches Factorio in vanilla mode.
- **"Sync to Factorio" Button:** Copies/symlinks the active profile directly into `%APPDATA%\Factorio\mods`, allowing you to launch normally through Steam with your active profile.

---

## Proposed Project Structure

```
Factorio Mod Manger/
├── electron/
│   ├── main.ts               # Electron main process & IPC handlers
│   └── preload.ts            # Secure preload bridge
├── src/
│   ├── core/
│   │   ├── factorioService.ts  # Game detection, launch CLI, mod-list.json manager
│   │   ├── modPortalService.ts # Catalog fetcher, search, details, cache
│   │   ├── downloadService.ts  # re146 mirror downloader, queue, SHA1 check
│   │   ├── dependencyService.ts# Factorio dependency parser & resolver
│   │   └── profileService.ts   # Profile CRUD, import/export code generator
│   ├── components/
│   │   ├── Sidebar.tsx         # Profile switcher, Start buttons, navigation
│   │   ├── InstalledView.tsx   # Installed mods list, toggles, updates
│   │   ├── OnlineView.tsx      # Catalog browser, search bar, sort, filters
│   │   ├── ModCard.tsx         # Mod card with badges and quick actions
│   │   ├── ModDetailsModal.tsx # Full markdown description, releases, dependencies
│   │   ├── ProfileModal.tsx    # Import/Export/Clone profile dialogs
│   │   ├── SettingsModal.tsx   # Factorio paths, mirror settings, theme
│   │   └── DownloadBar.tsx     # Floating download progress bar
│   ├── types/
│   │   └── index.ts            # Mod, Release, Profile, Dependency interfaces
│   ├── App.tsx                 # Main layout and view routing
│   ├── main.tsx                # React entry point
│   └── index.css               # Tailwind CSS & custom Factorio theme
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

---

## Verification Plan

### 1. Catalog & Search Verification
- Fetch and cache `https://mods.factorio.com/api/mods?page_size=max`.
- Verify search responsiveness (e.g. searching "space", "train", "flib", "quality").
- Verify mod details and markdown readme rendering for top mods.

### 2. re146 Mirror Download & Dependency Resolution
- Test downloading a mod with dependencies (e.g. `AutoDeconstruct` or `flib`).
- Verify zip saved in profile folder with valid file size and checksum.
- Verify dependency graph automatically identifies and downloads required dependencies.

### 3. Profile & Game Integration Verification
- Create two test profiles: "Profile A" and "Profile B".
- Toggle mods in Profile A, verify isolated `mod-list.json` reflects enabled states.
- Test "Export Profile" string code and import into a new profile.
- Verify "Start Modded" correctly executes `factorio.exe --mod-directory ...`.
