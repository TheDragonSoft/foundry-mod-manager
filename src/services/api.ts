import type { AppSettings, DownloadProgress, InstalledMod, LaunchStatus, ModItem, ModProfile, ProfileDetail } from '../types';

async function ipc<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err: any) {
    const msg = err?.message || String(err);
    const cleaned = msg.replace(/^Error:\s*Error invoking remote method '[^']+':\s*(?:Error:\s*)?/, '');
    throw new Error(cleaned);
  }
}

export const api = {
  // Status
  async getStatus(): Promise<{
    ok: boolean;
    activeProfileId: string;
    activeProfile?: ModProfile;
    installedCount: number;
    enabledCount: number;
    settings: AppSettings;
  }> {
    return ipc(() => window.electronAPI.getStatus());
  },

  // Settings
  async getSettings(): Promise<AppSettings> {
    return ipc(() => window.electronAPI.getSettings());
  },

  async updateSettings(settings: Partial<AppSettings>): Promise<AppSettings> {
    return ipc(() => window.electronAPI.updateSettings(settings));
  },

  async autoDetectPaths(): Promise<AppSettings & { detected: any }> {
    return ipc(() => window.electronAPI.autoDetectPaths());
  },

  // Profiles
  async getProfiles(): Promise<ModProfile[]> {
    return ipc(() => window.electronAPI.getProfiles());
  },

  async getActiveProfile(): Promise<ProfileDetail> {
    return ipc(() => window.electronAPI.getActiveProfile());
  },

  async setActiveProfile(id: string): Promise<{ success: boolean }> {
    return ipc(() => window.electronAPI.setActiveProfile(id));
  },

  async createProfile(name: string, description?: string): Promise<ModProfile> {
    return ipc(() => window.electronAPI.createProfile(name, description));
  },

  async duplicateProfile(id: string, name: string): Promise<ModProfile> {
    return ipc(() => window.electronAPI.duplicateProfile(id, name));
  },

  async deleteProfile(id: string): Promise<{ success: boolean }> {
    return ipc(() => window.electronAPI.deleteProfile(id));
  },

  async exportProfileCode(id: string): Promise<{ code: string }> {
    return ipc(() => window.electronAPI.exportProfileCode(id));
  },

  async importProfileCode(code: string, name?: string): Promise<{ profile: ModProfile; errors: string[] }> {
    return ipc(() => window.electronAPI.importProfileCode(code, name));
  },

  // Catalog
  async searchMods(params: {
    query?: string;
    factorioVersion?: string;
    category?: string;
    tag?: string;
    sortBy?: 'downloads' | 'score' | 'updated' | 'name';
    page?: number;
    pageSize?: number;
  }): Promise<{ items: ModItem[]; total: number; page: number; pageCount: number }> {
    return ipc(() => window.electronAPI.searchMods(params));
  },

  async refreshCatalog(): Promise<{ success: boolean; count: number }> {
    return ipc(() => window.electronAPI.refreshCatalog());
  },

  async getModDetails(name: string): Promise<ModItem> {
    return ipc(() => window.electronAPI.getModDetails(name));
  },

  // Mod operations
  async installMod(name: string, version?: string, profileId?: string): Promise<{
    success: boolean;
    installed: { name: string; version: string }[];
    errors: string[];
  }> {
    return ipc(() => window.electronAPI.installMod({ name, version, profileId }));
  },

  async toggleMod(name: string, enabled: boolean, profileId?: string): Promise<{ success: boolean }> {
    return ipc(() => window.electronAPI.toggleMod({ name, enabled, profileId }));
  },

  async uninstallMod(name: string, profileId?: string): Promise<{ success: boolean }> {
    return ipc(() => window.electronAPI.uninstallMod({ name, profileId }));
  },

  // Launcher
  async launchModded(profileId?: string): Promise<LaunchStatus> {
    return ipc(() => window.electronAPI.launchModded(profileId));
  },

  async launchVanilla(): Promise<LaunchStatus> {
    return ipc(() => window.electronAPI.launchVanilla());
  },

  async syncToGame(profileId?: string): Promise<{ success: boolean; count: number; error?: string }> {
    return ipc(() => window.electronAPI.syncToGame(profileId));
  },

  // Download events (push from main process)
  subscribeDownloadEvents(onEvent: (progress: DownloadProgress) => void): () => void {
    return window.electronAPI.onDownloadProgress(onEvent);
  },

  // Native dialogs
  async openFileDialog(options?: { title?: string; filters?: { name: string; extensions: string[] }[] }): Promise<string | null> {
    return ipc(() => window.electronAPI.openFileDialog(options));
  },

  async openDirectoryDialog(options?: { title?: string }): Promise<string | null> {
    return ipc(() => window.electronAPI.openDirectoryDialog(options));
  },
};
