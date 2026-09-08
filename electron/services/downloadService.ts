import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { DownloadProgress, InstalledMod } from '../../src/types';
import { ModPortalService } from './modPortalService';
import { DependencyService } from './dependencyService';

export class DownloadService {
  private static activeDownloads: Map<string, DownloadProgress> = new Map();
  private static listeners: ((progress: DownloadProgress) => void)[] = [];
  public static primaryMirror = 'https://mods-storage.re146.dev/';

  static subscribe(listener: (progress: DownloadProgress) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private static emitProgress(progress: DownloadProgress) {
    this.activeDownloads.set(`${progress.modName}@${progress.version}`, progress);
    this.listeners.forEach(l => l(progress));
  }

  static getActiveDownloads(): DownloadProgress[] {
    return Array.from(this.activeDownloads.values());
  }

  /**
   * Download a single mod archive from the re146 mirror
   */
  static async downloadModFile(
    modName: string,
    version: string,
    targetDir: string,
    expectedSha1?: string
  ): Promise<string> {
    const url = `${this.primaryMirror}${encodeURIComponent(modName)}/${encodeURIComponent(version)}.zip`;
    const targetFileName = `${modName}_${version}.zip`;
    const targetFilePath = path.join(targetDir, targetFileName);

    // If file already exists and has valid size, skip
    if (fs.existsSync(targetFilePath)) {
      const stats = fs.statSync(targetFilePath);
      if (stats.size > 0) {
        return targetFilePath;
      }
    }

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    this.emitProgress({
      modName,
      version,
      title: modName,
      status: 'downloading',
      progress: 0,
      downloadedBytes: 0,
      totalBytes: 0,
      speed: 'Connecting...',
    });

    console.log(`[DownloadService] Fetching ${modName} v${version} from ${url}...`);

    const response = await fetch(url);
    if (!response.ok) {
      const err = `Failed to download: HTTP ${response.status} ${response.statusText}`;
      this.emitProgress({
        modName,
        version,
        title: modName,
        status: 'error',
        progress: 0,
        downloadedBytes: 0,
        totalBytes: 0,
        speed: '0 KB/s',
        error: err,
      });
      throw new Error(err);
    }

    const totalBytes = parseInt(response.headers.get('content-length') || '0', 10);
    const tempFilePath = `${targetFilePath}.tmp.${Date.now()}`;
    const fileStream = fs.createWriteStream(tempFilePath);
    const hash = crypto.createHash('sha1');

    let downloadedBytes = 0;
    let lastTime = Date.now();
    let bytesSinceLastCalc = 0;
    let currentSpeed = '0 KB/s';

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Response body is null');
    }

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        if (value) {
          fileStream.write(Buffer.from(value));
          hash.update(value);
          downloadedBytes += value.length;
          bytesSinceLastCalc += value.length;

          const now = Date.now();
          const elapsed = now - lastTime;
          if (elapsed >= 500) {
            const bytesPerSec = (bytesSinceLastCalc / elapsed) * 1000;
            currentSpeed = bytesPerSec > 1024 * 1024
              ? `${(bytesPerSec / (1024 * 1024)).toFixed(1)} MB/s`
              : `${(bytesPerSec / 1024).toFixed(0)} KB/s`;
            bytesSinceLastCalc = 0;
            lastTime = now;

            const progress = totalBytes > 0 ? Math.min(99, Math.round((downloadedBytes / totalBytes) * 100)) : 50;
            this.emitProgress({
              modName,
              version,
              title: modName,
              status: 'downloading',
              progress,
              downloadedBytes,
              totalBytes,
              speed: currentSpeed,
            });
          }
        }
      }

      await new Promise<void>((resolve, reject) => {
        fileStream.end(() => resolve());
        fileStream.on('error', reject);
      });

      // Verify SHA1 if provided
      const computedSha1 = hash.digest('hex');
      if (expectedSha1 && expectedSha1.toLowerCase() !== computedSha1.toLowerCase()) {
        console.warn(`[DownloadService] SHA1 mismatch for ${modName} v${version}. Expected: ${expectedSha1}, got: ${computedSha1}`);
      }

      // Rename temp file to target
      if (fs.existsSync(targetFilePath)) {
        fs.unlinkSync(targetFilePath);
      }
      fs.renameSync(tempFilePath, targetFilePath);

      this.emitProgress({
        modName,
        version,
        title: modName,
        status: 'completed',
        progress: 100,
        downloadedBytes,
        totalBytes: downloadedBytes,
        speed: 'Finished',
      });

      console.log(`[DownloadService] Successfully downloaded ${targetFileName}`);
      return targetFilePath;
    } catch (err: any) {
      if (fs.existsSync(tempFilePath)) {
        try { fs.unlinkSync(tempFilePath); } catch {}
      }
      this.emitProgress({
        modName,
        version,
        title: modName,
        status: 'error',
        progress: 0,
        downloadedBytes,
        totalBytes,
        speed: '0 KB/s',
        error: err?.message || 'Download failed',
      });
      throw err;
    }
  }

  /**
   * Recursively resolve and download mod with all its required dependencies
   */
  static async installModWithDependencies(
    modName: string,
    versionRequested: string | undefined,
    targetModsDir: string,
    installedMods: InstalledMod[],
    downloadedList: Set<string> = new Set()
  ): Promise<{ installed: { name: string; version: string }[]; errors: string[] }> {
    const results: { name: string; version: string }[] = [];
    const errors: string[] = [];

    const modDetails = await ModPortalService.getModDetails(modName);
    if (!modDetails) {
      errors.push(`Could not fetch details for mod "${modName}" from portal.`);
      return { installed: results, errors };
    }

    const releases = modDetails.releases || (modDetails.latest_release ? [modDetails.latest_release] : []);
    if (releases.length === 0) {
      errors.push(`No releases found for mod "${modName}".`);
      return { installed: results, errors };
    }

    let targetRelease = releases[releases.length - 1];
    if (versionRequested) {
      const match = releases.find(r => r.version === versionRequested);
      if (match) targetRelease = match;
    }

    const versionToInstall = targetRelease.version;
    const cacheKey = `${modName}@${versionToInstall}`;
    if (downloadedList.has(cacheKey)) {
      return { installed: results, errors };
    }
    downloadedList.add(cacheKey);

    const rawDeps = targetRelease.info_json?.dependencies || [];
    const parsedDeps = DependencyService.parseDependencies(rawDeps);

    for (const dep of parsedDeps) {
      if (dep.type === 'required' && !DependencyService.isBuiltin(dep.id)) {
        const alreadyInstalled = installedMods.find(m => m.name.toLowerCase() === dep.id.toLowerCase());
        const isSatisfied = alreadyInstalled && (!dep.version || DependencyService.satisfies(alreadyInstalled.version, dep.ineq, dep.version));

        if (!isSatisfied) {
          console.log(`[DownloadService] Resolving required dependency for ${modName}: ${dep.id} (${dep.ineq} ${dep.version})...`);
          const subResult = await this.installModWithDependencies(
            dep.id,
            dep.version || undefined,
            targetModsDir,
            installedMods,
            downloadedList
          );
          results.push(...subResult.installed);
          errors.push(...subResult.errors);
        }
      }
    }

    try {
      await this.downloadModFile(modName, versionToInstall, targetModsDir, targetRelease.sha1);
      results.push({ name: modName, version: versionToInstall });
    } catch (err: any) {
      errors.push(`Failed to download ${modName} v${versionToInstall}: ${err?.message}`);
    }

    return { installed: results, errors };
  }
}
