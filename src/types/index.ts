export interface ModRelease {
  version: string;
  factorio_version?: string;
  file_name: string;
  download_url?: string;
  released_at: string;
  sha1?: string;
  info_json?: {
    factorio_version?: string;
    dependencies?: string[];
    description?: string;
    title?: string;
    author?: string;
    homepage?: string;
  };
}

export interface ParsedDependency {
  id: string;
  type: 'required' | 'optional' | 'hidden_optional' | 'incompatible' | 'order_only';
  ineq: string; // '>=', '<=', '=', '>', '<', or ''
  version: string; // e.g. '2.0.0'
  raw: string;
}

export interface ModItem {
  name: string;
  title: string;
  owner: string;
  summary: string;
  downloads_count: number;
  category?: string;
  score?: number;
  thumbnail?: string;
  updated_at?: string;
  latest_release?: ModRelease;
  releases?: ModRelease[];
  description?: string;
  changelog?: string;
  license?: {
    id: string;
    name: string;
    url?: string;
  };
  homepage?: string;
  source_url?: string;
}

export interface InstalledMod {
  name: string;
  title: string;
  author: string;
  summary: string;
  version: string;
  enabled: boolean;
  fileName: string;
  fileSizeBytes?: number;
  category?: string;
  factorioVersion?: string;
  dependencies: ParsedDependency[];
  latestAvailableVersion?: string;
  hasUpdate?: boolean;
  thumbnail?: string;
}

export interface ModProfile {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  modsCount: number;
  enabledCount: number;
}

export interface ProfileDetail extends ModProfile {
  mods: InstalledMod[];
}

export interface DownloadProgress {
  modName: string;
  version: string;
  title: string;
  status: 'pending' | 'downloading' | 'verifying' | 'installing' | 'completed' | 'error';
  progress: number; // 0 - 100
  downloadedBytes: number;
  totalBytes: number;
  speed: string;
  error?: string;
}

export interface AppSettings {
  factorioExePath: string;
  factorioWritePath: string; // AppData path
  primaryMirror: string;
  customLaunchArgs: string;
  autoCheckUpdates: boolean;
  concurrentDownloads: number;
  closeOnLaunch: boolean;
}

export interface LaunchStatus {
  success: boolean;
  message?: string;
  pid?: number;
}
