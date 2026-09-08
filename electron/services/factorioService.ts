import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { AppSettings, LaunchStatus } from '../../src/types';
import { ProfileService } from './profileService';

export class FactorioService {
  private static settingsPath = '';
  private static settings: AppSettings = {
    factorioExePath: '',
    factorioWritePath: path.join(process.env.APPDATA || '', 'Factorio'),
    primaryMirror: 'https://mods-storage.re146.dev/',
    customLaunchArgs: '',
    autoCheckUpdates: true,
    concurrentDownloads: 3,
    closeOnLaunch: false,
  };

  static init(dataDir: string) {
    this.settingsPath = path.join(dataDir, 'settings.json');
    this.loadSettings();
    if (!this.settings.factorioExePath || !fs.existsSync(this.settings.factorioExePath)) {
      this.autoDetectPaths();
    }
  }

  static getSettings(): AppSettings {
    return { ...this.settings };
  }

  static updateSettings(newSettings: Partial<AppSettings>): AppSettings {
    this.settings = { ...this.settings, ...newSettings };
    this.saveSettings();
    return this.settings;
  }

  private static loadSettings() {
    try {
      if (fs.existsSync(this.settingsPath)) {
        const raw = fs.readFileSync(this.settingsPath, 'utf-8');
        this.settings = { ...this.settings, ...JSON.parse(raw) };
      }
    } catch (err) {
      console.warn('[FactorioService] Failed to load settings:', err);
    }
  }

  private static saveSettings() {
    const dir = path.dirname(this.settingsPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(this.settingsPath, JSON.stringify(this.settings, null, 2), 'utf-8');
  }

  static autoDetectPaths(): { exe: string | null; appData: string | null } {
    const possibleExePaths = [
      'D:\\Games\\Factorio\\bin\\x64\\factorio.exe',
      'C:\\Program Files (x86)\\Steam\\steamapps\\common\\Factorio\\bin\\x64\\factorio.exe',
      'C:\\Program Files\\Steam\\steamapps\\common\\Factorio\\bin\\x64\\factorio.exe',
      'D:\\SteamLibrary\\steamapps\\common\\Factorio\\bin\\x64\\factorio.exe',
      'E:\\SteamLibrary\\steamapps\\common\\Factorio\\bin\\x64\\factorio.exe',
      'C:\\GOG Games\\Factorio\\bin\\x64\\factorio.exe',
    ];

    let foundExe: string | null = null;
    for (const p of possibleExePaths) {
      if (fs.existsSync(p)) {
        foundExe = p;
        break;
      }
    }

    const appData = path.join(process.env.APPDATA || '', 'Factorio');
    const foundAppData = fs.existsSync(appData) ? appData : null;

    if (foundExe) this.settings.factorioExePath = foundExe;
    if (foundAppData) this.settings.factorioWritePath = foundAppData;
    this.saveSettings();

    return { exe: foundExe, appData: foundAppData };
  }

  static launchModded(profileId?: string): LaunchStatus {
    const exePath = this.settings.factorioExePath;
    if (!exePath || !fs.existsSync(exePath)) {
      return {
        success: false,
        message: 'Factorio executable not found! Please set the path in Settings.',
      };
    }

    const targetProfileId = profileId || ProfileService.getActiveProfileId();
    const modsDir = ProfileService.getProfileModsDir(targetProfileId);

    const args = ['--mod-directory', modsDir];
    if (this.settings.customLaunchArgs.trim()) {
      args.push(...this.settings.customLaunchArgs.trim().split(/\s+/));
    }

    try {
      console.log(`[FactorioService] Launching modded: "${exePath}" ${args.join(' ')}`);
      const child = spawn(exePath, args, {
        detached: true,
        stdio: 'ignore',
      });
      child.unref();

      return {
        success: true,
        pid: child.pid,
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Failed to launch Factorio: ${err?.message}`,
      };
    }
  }

  static launchVanilla(): LaunchStatus {
    const exePath = this.settings.factorioExePath;
    if (!exePath || !fs.existsSync(exePath)) {
      return {
        success: false,
        message: 'Factorio executable not found! Please set the path in Settings.',
      };
    }

    const args: string[] = [];
    if (this.settings.customLaunchArgs.trim()) {
      args.push(...this.settings.customLaunchArgs.trim().split(/\s+/));
    }

    try {
      console.log(`[FactorioService] Launching vanilla: "${exePath}" ${args.join(' ')}`);
      const child = spawn(exePath, args, {
        detached: true,
        stdio: 'ignore',
      });
      child.unref();

      return {
        success: true,
        pid: child.pid,
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Failed to launch Factorio: ${err?.message}`,
      };
    }
  }

  static syncToGameDirectory(profileId?: string): { success: boolean; count: number; error?: string } {
    try {
      const targetProfileId = profileId || ProfileService.getActiveProfileId();
      const profileModsDir = ProfileService.getProfileModsDir(targetProfileId);
      const appDataModsDir = path.join(this.settings.factorioWritePath, 'mods');

      if (!fs.existsSync(appDataModsDir)) {
        fs.mkdirSync(appDataModsDir, { recursive: true });
      }

      const profileFiles = fs.readdirSync(profileModsDir);
      let copiedCount = 0;

      const profileModList = ProfileService.getProfileModListPath(targetProfileId);
      if (fs.existsSync(profileModList)) {
        fs.copyFileSync(profileModList, path.join(appDataModsDir, 'mod-list.json'));
      }

      for (const file of profileFiles) {
        if (file.endsWith('.zip')) {
          fs.copyFileSync(path.join(profileModsDir, file), path.join(appDataModsDir, file));
          copiedCount++;
        }
      }

      return { success: true, count: copiedCount };
    } catch (err: any) {
      console.error('[FactorioService] Error syncing to game directory:', err);
      return { success: false, count: 0, error: err?.message };
    }
  }
}
