import fs from 'fs';
import path from 'path';
import AdmZip from 'adm-zip';
import { InstalledMod } from '../../src/types';
import { DependencyService } from './dependencyService';
import { ModPortalService } from './modPortalService';
import { DownloadService } from './downloadService';

export interface StoredProfile {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export class ProfileService {
  private static baseDir = '';
  private static profilesJsonPath = '';
  private static activeProfileId = 'default';

  static init(dataDir: string) {
    this.baseDir = path.join(dataDir, 'profiles');
    this.profilesJsonPath = path.join(dataDir, 'profiles.json');

    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }

    const profiles = this.listProfiles();
    if (profiles.length === 0) {
      this.createProfile('Default', 'Default mod profile');
    } else {
      this.activeProfileId = profiles[0].id;
    }
  }

  static getActiveProfileId(): string {
    return this.activeProfileId;
  }

  static setActiveProfileId(id: string) {
    const exists = this.listProfiles().some(p => p.id === id);
    if (!exists) throw new Error(`Profile ${id} not found`);
    this.activeProfileId = id;
  }

  static listProfiles(): StoredProfile[] {
    try {
      if (fs.existsSync(this.profilesJsonPath)) {
        const raw = fs.readFileSync(this.profilesJsonPath, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (err) {
      console.error('[ProfileService] Failed to read profiles.json:', err);
    }
    return [];
  }

  static saveProfiles(profiles: StoredProfile[]) {
    const dir = path.dirname(this.profilesJsonPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(this.profilesJsonPath, JSON.stringify(profiles, null, 2), 'utf-8');
  }

  static getProfileModsDir(profileId: string): string {
    const dir = path.join(this.baseDir, profileId, 'mods');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    return dir;
  }

  static getProfileModListPath(profileId: string): string {
    return path.join(this.getProfileModsDir(profileId), 'mod-list.json');
  }

  static createProfile(name: string, description?: string): StoredProfile {
    const id = name.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Date.now().toString(36);
    const profiles = this.listProfiles();

    const newProfile: StoredProfile = {
      id,
      name,
      description: description || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    profiles.push(newProfile);
    this.saveProfiles(profiles);

    const modsDir = this.getProfileModsDir(id);
    const defaultModList = {
      mods: [
        { name: 'base', enabled: true },
        { name: 'elevated-rails', enabled: true },
        { name: 'quality', enabled: true },
        { name: 'space-age', enabled: true }
      ]
    };

    fs.writeFileSync(path.join(modsDir, 'mod-list.json'), JSON.stringify(defaultModList, null, 2), 'utf-8');
    this.activeProfileId = id;
    return newProfile;
  }

  static duplicateProfile(sourceId: string, newName: string): StoredProfile {
    const sourceDir = this.getProfileModsDir(sourceId);
    const newProfile = this.createProfile(newName, `Copy of ${sourceId}`);
    const destDir = this.getProfileModsDir(newProfile.id);

    const files = fs.readdirSync(sourceDir);
    for (const file of files) {
      fs.copyFileSync(path.join(sourceDir, file), path.join(destDir, file));
    }

    return newProfile;
  }

  static deleteProfile(profileId: string) {
    const profiles = this.listProfiles().filter(p => p.id !== profileId);
    if (profiles.length === 0) {
      throw new Error('Cannot delete the only remaining profile');
    }
    this.saveProfiles(profiles);

    const profileDir = path.join(this.baseDir, profileId);
    if (fs.existsSync(profileDir)) {
      fs.rmSync(profileDir, { recursive: true, force: true });
    }

    if (this.activeProfileId === profileId) {
      this.activeProfileId = profiles[0].id;
    }
  }

  static async getInstalledMods(profileId: string): Promise<InstalledMod[]> {
    const modsDir = this.getProfileModsDir(profileId);
    const modListPath = this.getProfileModListPath(profileId);

    let modListMap: Record<string, boolean> = {};
    if (fs.existsSync(modListPath)) {
      try {
        const raw = fs.readFileSync(modListPath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.mods)) {
          parsed.mods.forEach((m: any) => {
            modListMap[m.name] = m.enabled !== false;
          });
        }
      } catch (err) {
        console.error('[ProfileService] Error reading mod-list.json:', err);
      }
    }

    const files = fs.readdirSync(modsDir);
    const installed: InstalledMod[] = [];
    const catalog = await ModPortalService.getCatalog();

    for (const file of files) {
      const filePath = path.join(modsDir, file);
      let isZip = file.endsWith('.zip');
      let isDirectory = false;
      try {
        isDirectory = fs.statSync(filePath).isDirectory();
      } catch {}

      if (!isZip && !isDirectory) continue;

      try {
        let infoContent: string | null = null;
        let thumbnail: string | undefined = undefined;
        let fileSizeBytes = 0;

        if (isZip) {
          const zip = new AdmZip(filePath);
          const zipEntries = zip.getEntries();
          const infoEntry = zipEntries.find(e => e.entryName.endsWith('info.json') && !e.isDirectory);
          if (infoEntry) {
            infoContent = zip.readAsText(infoEntry);
          }

          const thumbEntry = zipEntries.find(e =>
            !e.isDirectory && (e.entryName.toLowerCase().endsWith('thumbnail.png') || e.entryName.toLowerCase().endsWith('thumbnail.jpg'))
          );
          if (thumbEntry) {
            try {
              const thumbBuffer = zip.readFile(thumbEntry);
              const mime = thumbEntry.entryName.toLowerCase().endsWith('.jpg') ? 'image/jpeg' : 'image/png';
              thumbnail = `data:${mime};base64,${thumbBuffer.toString('base64')}`;
            } catch (err) {
              console.warn(`[ProfileService] Error reading thumbnail from ${file}:`, err);
            }
          }

          try {
            fileSizeBytes = fs.statSync(filePath).size;
          } catch {}
        } else if (isDirectory) {
          const infoPath = path.join(filePath, 'info.json');
          if (fs.existsSync(infoPath)) {
            infoContent = fs.readFileSync(infoPath, 'utf-8');
          }
          const thumbPng = path.join(filePath, 'thumbnail.png');
          const thumbJpg = path.join(filePath, 'thumbnail.jpg');
          if (fs.existsSync(thumbPng)) {
            try {
              const buf = fs.readFileSync(thumbPng);
              thumbnail = `data:image/png;base64,${buf.toString('base64')}`;
            } catch {}
          } else if (fs.existsSync(thumbJpg)) {
            try {
              const buf = fs.readFileSync(thumbJpg);
              thumbnail = `data:image/jpeg;base64,${buf.toString('base64')}`;
            } catch {}
          }
        }

        if (infoContent) {
          const info = JSON.parse(infoContent);
          const modName = info.name;
          const version = info.version;
          const enabled = modListMap[modName] !== false;
          const parsedDeps = DependencyService.parseDependencies(info.dependencies || []);

          const catalogItem = catalog.find(c => c.name.toLowerCase() === modName.toLowerCase());
          const latestAvailable = catalogItem?.latest_release?.version;
          const hasUpdate = latestAvailable ? DependencyService.compareVersions(latestAvailable, version) > 0 : false;

          if (!thumbnail) {
            let cachedThumb = ModPortalService.getThumbnail(modName) || catalogItem?.thumbnail;
            if (!cachedThumb) {
              try {
                const details = await ModPortalService.getModDetails(modName);
                if (details?.thumbnail) {
                  cachedThumb = details.thumbnail;
                }
              } catch {}
            }
            if (cachedThumb) {
              thumbnail = cachedThumb.startsWith('http')
                ? cachedThumb.replace(/^https?:\/\/mods\.factorio\.com\//, 'https://assets-mod.factorio.com/')
                : `https://assets-mod.factorio.com${cachedThumb.startsWith('/') ? '' : '/'}${cachedThumb}`;
            }
          }

          installed.push({
            name: modName,
            title: info.title || catalogItem?.title || modName,
            author: info.author || catalogItem?.owner || '',
            summary: info.description || catalogItem?.summary || '',
            version,
            enabled,
            fileName: file,
            fileSizeBytes,
            category: catalogItem?.category,
            factorioVersion: info.factorio_version,
            dependencies: parsedDeps,
            latestAvailableVersion: latestAvailable,
            hasUpdate,
            thumbnail,
          });
        }
      } catch (err) {
        console.warn(`[ProfileService] Error reading mod ${file}:`, err);
      }
    }

    return installed;
  }

  static toggleMod(profileId: string, modName: string, enabled: boolean) {
    const modListPath = this.getProfileModListPath(profileId);
    let modList: { mods: { name: string; enabled: boolean }[] } = { mods: [] };

    if (fs.existsSync(modListPath)) {
      try {
        modList = JSON.parse(fs.readFileSync(modListPath, 'utf-8'));
      } catch {}
    }

    const item = modList.mods.find(m => m.name === modName);
    if (item) {
      item.enabled = enabled;
    } else {
      modList.mods.push({ name: modName, enabled });
    }

    fs.writeFileSync(modListPath, JSON.stringify(modList, null, 2), 'utf-8');
  }

  static uninstallMod(profileId: string, modName: string) {
    const modsDir = this.getProfileModsDir(profileId);
    const files = fs.readdirSync(modsDir);

    for (const file of files) {
      if (file.toLowerCase().startsWith(modName.toLowerCase() + '_') && file.endsWith('.zip')) {
        try {
          fs.unlinkSync(path.join(modsDir, file));
        } catch (err) {
          console.error(`Failed to delete ${file}:`, err);
        }
      }
    }

    const modListPath = this.getProfileModListPath(profileId);
    if (fs.existsSync(modListPath)) {
      try {
        const modList = JSON.parse(fs.readFileSync(modListPath, 'utf-8'));
        modList.mods = modList.mods.filter((m: any) => m.name !== modName);
        fs.writeFileSync(modListPath, JSON.stringify(modList, null, 2), 'utf-8');
      } catch {}
    }
  }

  static async exportProfileCode(profileId: string): Promise<string> {
    const profiles = this.listProfiles();
    const profile = profiles.find(p => p.id === profileId);
    if (!profile) throw new Error('Profile not found');

    const installed = await this.getInstalledMods(profileId);
    const exportData = {
      fmm: 1,
      name: profile.name,
      description: profile.description,
      mods: installed.map(m => ({
        name: m.name,
        version: m.version,
        enabled: m.enabled,
      })),
    };

    const json = JSON.stringify(exportData);
    return Buffer.from(json).toString('base64');
  }

  static async importProfileCode(code: string, customName?: string): Promise<{ profile: StoredProfile; errors: string[] }> {
    try {
      const json = Buffer.from(code.trim(), 'base64').toString('utf-8');
      const data = JSON.parse(json);

      if (!data.mods || !Array.isArray(data.mods)) {
        throw new Error('Invalid profile code format');
      }

      const profileName = customName || data.name || 'Imported Profile';
      const profile = this.createProfile(profileName, data.description || 'Imported via share code');
      const modsDir = this.getProfileModsDir(profile.id);

      const errors: string[] = [];
      const installed: InstalledMod[] = [];

      for (const mod of data.mods) {
        if (DependencyService.isBuiltin(mod.name)) continue;

        try {
          const res = await DownloadService.installModWithDependencies(
            mod.name,
            mod.version,
            modsDir,
            installed
          );
          errors.push(...res.errors);
          this.toggleMod(profile.id, mod.name, mod.enabled !== false);
        } catch (err: any) {
          errors.push(`Failed to import ${mod.name}: ${err?.message}`);
        }
      }

      return { profile, errors };
    } catch (err: any) {
      throw new Error(`Failed to parse profile code: ${err?.message}`);
    }
  }
}
