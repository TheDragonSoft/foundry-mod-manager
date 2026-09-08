import { app, BrowserWindow, ipcMain, dialog, shell, Menu } from 'electron';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { ModPortalService } from './services/modPortalService';
import { DownloadService } from './services/downloadService';
import { ProfileService } from './services/profileService';
import { FactorioService } from './services/factorioService';

let mainWindow: BrowserWindow | null = null;

function getDataDir(): string {
  return app.getPath('userData');
}

function createWindow() {
  Menu.setApplicationMenu(null);

  const iconIco = path.join(__dirname, '../build/icon.ico');
  const iconPng = path.join(__dirname, '../build/icon.png');
  const windowIcon = fs.existsSync(iconIco) ? iconIco : fs.existsSync(iconPng) ? iconPng : undefined;

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 1024,
    minHeight: 700,
    backgroundColor: '#17140f',
    title: 'Foundry — mod manager',
    autoHideMenuBar: true,
    icon: windowIcon,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.mjs'),
    },
  });

  mainWindow.setMenu(null);
  if (typeof mainWindow.removeMenu === 'function') {
    mainWindow.removeMenu();
  }

  const isDev = !app.isPackaged;
  const url = isDev
    ? process.env['VITE_DEV_SERVER_URL'] || 'http://localhost:5173'
    : `file://${path.join(__dirname, '../dist/index.html')}`;

  mainWindow.loadURL(url);

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Subscribe to download progress and forward to renderer
  DownloadService.subscribe((progress) => {
    mainWindow?.webContents.send('downloads:progress', progress);
  });
}

function initServices() {
  const dataDir = getDataDir();
  console.log(`[Main] Data directory: ${dataDir}`);
  ModPortalService.init(dataDir);
  ProfileService.init(dataDir);
  FactorioService.init(dataDir);
  DownloadService.primaryMirror = FactorioService.getSettings().primaryMirror || 'https://mods-storage.re146.dev/';
}

function registerIpcHandlers() {
  // ── App Status ──
  ipcMain.handle('app:get-status', async () => {
    const activeProfileId = ProfileService.getActiveProfileId();
    const profiles = ProfileService.listProfiles();
    const settings = FactorioService.getSettings();
    const installed = await ProfileService.getInstalledMods(activeProfileId);

    return {
      ok: true,
      activeProfileId,
      activeProfile: profiles.find(p => p.id === activeProfileId),
      installedCount: installed.length,
      enabledCount: installed.filter(m => m.enabled).length,
      settings,
    };
  });

  // ── Settings ──
  ipcMain.handle('settings:get', () => {
    return FactorioService.getSettings();
  });

  ipcMain.handle('settings:update', (_event, settings: any) => {
    const updated = FactorioService.updateSettings(settings);
    if (updated.primaryMirror) {
      DownloadService.primaryMirror = updated.primaryMirror;
    }
    return updated;
  });

  ipcMain.handle('settings:autodetect', () => {
    const detected = FactorioService.autoDetectPaths();
    return { ...FactorioService.getSettings(), detected };
  });

  // ── Profiles ──
  ipcMain.handle('profiles:list', async () => {
    const profiles = ProfileService.listProfiles();
    const results = [];

    for (const p of profiles) {
      const installed = await ProfileService.getInstalledMods(p.id);
      results.push({
        ...p,
        modsCount: installed.length,
        enabledCount: installed.filter(m => m.enabled).length,
      });
    }

    return results;
  });

  ipcMain.handle('profiles:get-active', async () => {
    const id = ProfileService.getActiveProfileId();
    const profiles = ProfileService.listProfiles();
    const profile = profiles.find(p => p.id === id);
    if (!profile) throw new Error('Active profile not found');

    const mods = await ProfileService.getInstalledMods(id);
    return {
      ...profile,
      modsCount: mods.length,
      enabledCount: mods.filter(m => m.enabled).length,
      mods,
    };
  });

  ipcMain.handle('profiles:set-active', (_event, { id }: { id: string }) => {
    ProfileService.setActiveProfileId(id);
    return { success: true, activeProfileId: id };
  });

  ipcMain.handle('profiles:create', (_event, { name, description }: { name: string; description?: string }) => {
    if (!name) throw new Error('Name is required');
    return ProfileService.createProfile(name, description);
  });

  ipcMain.handle('profiles:duplicate', (_event, { id, name }: { id: string; name: string }) => {
    return ProfileService.duplicateProfile(id, name || `${id}_copy`);
  });

  ipcMain.handle('profiles:delete', (_event, { id }: { id: string }) => {
    ProfileService.deleteProfile(id);
    return { success: true };
  });

  ipcMain.handle('profiles:export', async (_event, { id }: { id: string }) => {
    const code = await ProfileService.exportProfileCode(id);
    return { code };
  });

  ipcMain.handle('profiles:import', async (_event, { code, name }: { code: string; name?: string }) => {
    if (!code) throw new Error('Profile code is required');
    return await ProfileService.importProfileCode(code, name);
  });

  // ── Mod Portal Catalog ──
  ipcMain.handle('mods:search', async (_event, params: any) => {
    return await ModPortalService.searchMods({
      query: params.query,
      factorioVersion: params.factorioVersion,
      category: params.category,
      tag: params.tag,
      sortBy: params.sortBy,
      page: params.page ? parseInt(params.page, 10) : undefined,
      pageSize: params.pageSize ? parseInt(params.pageSize, 10) : undefined,
    });
  });

  ipcMain.handle('mods:refresh-catalog', async () => {
    const catalog = await ModPortalService.getCatalog(true);
    return { success: true, count: catalog.length };
  });

  ipcMain.handle('mods:get-details', async (_event, { name }: { name: string }) => {
    const details = await ModPortalService.getModDetails(name);
    if (!details) throw new Error('Mod not found');
    return details;
  });

  // ── Mod Operations ──
  ipcMain.handle('mods:install', async (_event, { name, version, profileId }: { name: string; version?: string; profileId?: string }) => {
    if (!name) throw new Error('Mod name is required');

    const targetProfileId = profileId || ProfileService.getActiveProfileId();
    const targetDir = ProfileService.getProfileModsDir(targetProfileId);
    const installedMods = await ProfileService.getInstalledMods(targetProfileId);

    const result = await DownloadService.installModWithDependencies(
      name,
      version,
      targetDir,
      installedMods
    );

    // Auto-enable installed mods in mod-list.json
    for (const item of result.installed) {
      ProfileService.toggleMod(targetProfileId, item.name, true);
    }

    return {
      success: true,
      installed: result.installed,
      errors: result.errors,
    };
  });

  ipcMain.handle('mods:toggle', (_event, { name, enabled, profileId }: { name: string; enabled: boolean; profileId?: string }) => {
    if (!name) throw new Error('Mod name is required');
    const targetProfileId = profileId || ProfileService.getActiveProfileId();
    ProfileService.toggleMod(targetProfileId, name, enabled);
    return { success: true };
  });

  ipcMain.handle('mods:uninstall', (_event, { name, profileId }: { name: string; profileId?: string }) => {
    if (!name) throw new Error('Mod name is required');
    const targetProfileId = profileId || ProfileService.getActiveProfileId();
    ProfileService.uninstallMod(targetProfileId, name);
    return { success: true };
  });

  // ── Launcher ──
  ipcMain.handle('launch:modded', (_event, { profileId }: { profileId?: string } = {}) => {
    return FactorioService.launchModded(profileId);
  });

  ipcMain.handle('launch:vanilla', () => {
    return FactorioService.launchVanilla();
  });

  ipcMain.handle('launch:sync', (_event, { profileId }: { profileId?: string } = {}) => {
    return FactorioService.syncToGameDirectory(profileId);
  });

  // ── Downloads ──
  ipcMain.handle('downloads:get-active', () => {
    return DownloadService.getActiveDownloads();
  });

  // ── Native Dialogs ──
  ipcMain.handle('dialog:open-file', async (_event, options?: { title?: string; filters?: { name: string; extensions: string[] }[] }) => {
    if (!mainWindow) return null;
    const result = await dialog.showOpenDialog(mainWindow, {
      title: options?.title || 'Select File',
      properties: ['openFile'],
      filters: options?.filters || [
        { name: 'Executables', extensions: ['exe'] },
        { name: 'All Files', extensions: ['*'] },
      ],
    });
    return result.canceled ? null : result.filePaths[0] || null;
  });

  ipcMain.handle('dialog:open-directory', async (_event, options?: { title?: string }) => {
    if (!mainWindow) return null;
    const result = await dialog.showOpenDialog(mainWindow, {
      title: options?.title || 'Select Directory',
      properties: ['openDirectory'],
    });
    return result.canceled ? null : result.filePaths[0] || null;
  });
}

// ── App Lifecycle ──
app.whenReady().then(() => {
  initServices();
  registerIpcHandlers();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
