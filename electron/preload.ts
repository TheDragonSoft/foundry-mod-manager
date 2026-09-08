import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  isElectron: true,

  // ── App Status ──
  getStatus: () => ipcRenderer.invoke('app:get-status'),

  // ── Settings ──
  getSettings: () => ipcRenderer.invoke('settings:get'),
  updateSettings: (settings: any) => ipcRenderer.invoke('settings:update', settings),
  autoDetectPaths: () => ipcRenderer.invoke('settings:autodetect'),

  // ── Profiles ──
  getProfiles: () => ipcRenderer.invoke('profiles:list'),
  getActiveProfile: () => ipcRenderer.invoke('profiles:get-active'),
  setActiveProfile: (id: string) => ipcRenderer.invoke('profiles:set-active', { id }),
  createProfile: (name: string, description?: string) => ipcRenderer.invoke('profiles:create', { name, description }),
  duplicateProfile: (id: string, name: string) => ipcRenderer.invoke('profiles:duplicate', { id, name }),
  deleteProfile: (id: string) => ipcRenderer.invoke('profiles:delete', { id }),
  exportProfileCode: (id: string) => ipcRenderer.invoke('profiles:export', { id }),
  importProfileCode: (code: string, name?: string) => ipcRenderer.invoke('profiles:import', { code, name }),

  // ── Mod Catalog ──
  searchMods: (params: any) => ipcRenderer.invoke('mods:search', params),
  refreshCatalog: () => ipcRenderer.invoke('mods:refresh-catalog'),
  getModDetails: (name: string) => ipcRenderer.invoke('mods:get-details', { name }),

  // ── Mod Operations ──
  installMod: (args: { name: string; version?: string; profileId?: string }) => ipcRenderer.invoke('mods:install', args),
  toggleMod: (args: { name: string; enabled: boolean; profileId?: string }) => ipcRenderer.invoke('mods:toggle', args),
  uninstallMod: (args: { name: string; profileId?: string }) => ipcRenderer.invoke('mods:uninstall', args),

  // ── Launcher ──
  launchModded: (profileId?: string) => ipcRenderer.invoke('launch:modded', { profileId }),
  launchVanilla: () => ipcRenderer.invoke('launch:vanilla'),
  syncToGame: (profileId?: string) => ipcRenderer.invoke('launch:sync', { profileId }),

  // ── Downloads ──
  getActiveDownloads: () => ipcRenderer.invoke('downloads:get-active'),
  onDownloadProgress: (callback: (progress: any) => void): (() => void) => {
    const handler = (_event: any, progress: any) => callback(progress);
    ipcRenderer.on('downloads:progress', handler);
    return () => {
      ipcRenderer.removeListener('downloads:progress', handler);
    };
  },

  // ── Native Dialogs ──
  openFileDialog: (options?: { title?: string; filters?: { name: string; extensions: string[] }[] }) =>
    ipcRenderer.invoke('dialog:open-file', options),
  openDirectoryDialog: (options?: { title?: string }) =>
    ipcRenderer.invoke('dialog:open-directory', options),
});
