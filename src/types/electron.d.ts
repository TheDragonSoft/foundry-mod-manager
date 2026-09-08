import type { AppSettings, DownloadProgress, InstalledMod, LaunchStatus, ModItem, ModProfile, ProfileDetail } from './index';

export interface ElectronAPI {
  platform: string;
  isElectron: boolean;

  // App Status
  getStatus(): Promise<{
    ok: boolean;
    activeProfileId: string;
    activeProfile?: ModProfile;
    installedCount: number;
    enabledCount: number;
    settings: AppSettings;
  }>;

  // Settings
  getSettings(): Promise<AppSettings>;
  updateSettings(settings: Partial<AppSettings>): Promise<AppSettings>;
  autoDetectPaths(): Promise<AppSettings & { detected: { exe: string | null; appData: string | null } }>;

  // Profiles
  getProfiles(): Promise<ModProfile[]>;
  getActiveProfile(): Promise<ProfileDetail>;
  setActiveProfile(id: string): Promise<{ success: boolean; activeProfileId: string }>;
  createProfile(name: string, description?: string): Promise<ModProfile>;
  duplicateProfile(id: string, name: string): Promise<ModProfile>;
  deleteProfile(id: string): Promise<{ success: boolean }>;
  exportProfileCode(id: string): Promise<{ code: string }>;
  importProfileCode(code: string, name?: string): Promise<{ profile: ModProfile; errors: string[] }>;

  // Mod Catalog
  searchMods(params: {
    query?: string;
    factorioVersion?: string;
    category?: string;
    sortBy?: 'downloads' | 'score' | 'updated' | 'name';
    page?: number;
    pageSize?: number;
  }): Promise<{ items: ModItem[]; total: number; page: number; pageCount: number }>;
  refreshCatalog(): Promise<{ success: boolean; count: number }>;
  getModDetails(name: string): Promise<ModItem>;

  // Mod Operations
  installMod(args: { name: string; version?: string; profileId?: string }): Promise<{
    success: boolean;
    installed: { name: string; version: string }[];
    errors: string[];
  }>;
  toggleMod(args: { name: string; enabled: boolean; profileId?: string }): Promise<{ success: boolean }>;
  uninstallMod(args: { name: string; profileId?: string }): Promise<{ success: boolean }>;

  // Launcher
  launchModded(profileId?: string): Promise<LaunchStatus>;
  launchVanilla(): Promise<LaunchStatus>;
  syncToGame(profileId?: string): Promise<{ success: boolean; count: number; error?: string }>;

  // Downloads
  getActiveDownloads(): Promise<DownloadProgress[]>;
  onDownloadProgress(callback: (progress: DownloadProgress) => void): () => void;

  // Native Dialogs
  openFileDialog(options?: { title?: string; filters?: { name: string; extensions: string[] }[] }): Promise<string | null>;
  openDirectoryDialog(options?: { title?: string }): Promise<string | null>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {};
