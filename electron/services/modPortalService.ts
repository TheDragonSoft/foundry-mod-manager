import fs from 'fs';
import path from 'path';
import { ModItem } from '../../src/types';

export class ModPortalService {
  private static catalogCache: ModItem[] = [];
  private static lastCatalogFetch: number = 0;
  private static readonly CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes
  private static isFetchingCatalog = false;
  private static cacheFilePath = '';
  private static thumbnailsFilePath = '';
  private static thumbnailMap: Record<string, string> = {};
  private static modDetailsCache: Map<string, { data: ModItem; timestamp: number }> = new Map();

  /**
   * Initialize with data directory path. Load cached catalog from disk if available.
   */
  static init(dataDir: string) {
    this.cacheFilePath = path.join(dataDir, 'mod_catalog_cache.json');
    this.thumbnailsFilePath = path.join(dataDir, 'mod_thumbnails_cache.json');

    try {
      if (fs.existsSync(this.thumbnailsFilePath)) {
        const raw = fs.readFileSync(this.thumbnailsFilePath, 'utf-8');
        this.thumbnailMap = JSON.parse(raw);
        console.log(`[ModPortalService] Loaded ${Object.keys(this.thumbnailMap).length} cached mod thumbnails.`);
      }
    } catch (err) {
      console.warn('[ModPortalService] Failed to load thumbnails cache:', err);
    }

    try {
      if (fs.existsSync(this.cacheFilePath)) {
        const raw = fs.readFileSync(this.cacheFilePath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.results)) {
          this.catalogCache = parsed.results;
          this.lastCatalogFetch = parsed.timestamp || Date.now();
          console.log(`[ModPortalService] Loaded ${this.catalogCache.length} mods from local disk cache.`);
        }
      }
    } catch (err) {
      console.warn('[ModPortalService] Failed to load disk cache:', err);
    }
  }

  static getThumbnail(name: string): string | undefined {
    return this.thumbnailMap[name.toLowerCase()] || this.thumbnailMap[name];
  }

  /**
   * Fetch complete catalog from official portal, with fallback
   */
  static async getCatalog(forceRefresh = false): Promise<ModItem[]> {
    const isCacheValid = !forceRefresh &&
      this.catalogCache.length > 0 &&
      (Date.now() - this.lastCatalogFetch) < this.CACHE_TTL_MS;

    if (isCacheValid) {
      return this.catalogCache;
    }

    if (this.isFetchingCatalog) {
      return this.catalogCache;
    }

    this.isFetchingCatalog = true;
    try {
      console.log('[ModPortalService] Fetching full catalog from mods.factorio.com/api/mods?page_size=max...');
      const response = await fetch('https://mods.factorio.com/api/mods?page_size=max', {
        headers: { 'User-Agent': 'FactorioModManager/1.0 (r2modman-style)' }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch catalog: HTTP ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      if (Array.isArray(data.results)) {
        this.catalogCache = data.results;
        this.lastCatalogFetch = Date.now();

        // Save to disk asynchronously
        const dir = path.dirname(this.cacheFilePath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFile(this.cacheFilePath, JSON.stringify({
          timestamp: this.lastCatalogFetch,
          results: this.catalogCache
        }), () => {});

        console.log(`[ModPortalService] Successfully indexed ${this.catalogCache.length} mods.`);
      }
    } catch (err) {
      console.error('[ModPortalService] Error fetching catalog:', err);
    } finally {
      this.isFetchingCatalog = false;
    }

    return this.catalogCache;
  }

  /**
   * Search, filter, and paginate through the cached catalog
   */
  static async searchMods(options: {
    query?: string;
    factorioVersion?: string;
    category?: string;
    tag?: string;
    sortBy?: 'downloads' | 'score' | 'updated' | 'name';
    page?: number;
    pageSize?: number;
  }): Promise<{ items: ModItem[]; total: number; page: number; pageCount: number }> {
    const catalog = await this.getCatalog();
    let filtered = catalog;

    const query = options.query?.trim().toLowerCase();
    if (query) {
      filtered = filtered.filter(mod => {
        return (
          (mod.name && mod.name.toLowerCase().includes(query)) ||
          (mod.title && mod.title.toLowerCase().includes(query)) ||
          (mod.owner && mod.owner.toLowerCase().includes(query)) ||
          (mod.summary && mod.summary.toLowerCase().includes(query))
        );
      });
    }

    if (options.tag) {
      const tagLower = options.tag.toLowerCase();
      filtered = filtered.filter(mod => {
        if (tagLower === 'space-age') {
          const deps = mod.latest_release?.info_json?.dependencies || [];
          const hasDep = deps.some(d => d.toLowerCase().includes('space-age'));
          const text = `${mod.name} ${mod.title} ${mod.summary || ''}`.toLowerCase();
          return hasDep || text.includes('space-age') || text.includes('space age');
        }
        const text = `${mod.name} ${mod.title} ${mod.summary || ''}`.toLowerCase();
        return text.includes(tagLower);
      });
    }

    if (options.factorioVersion && options.factorioVersion !== 'all') {
      const ver = options.factorioVersion;
      filtered = filtered.filter(mod => {
        const relVer = mod.latest_release?.info_json?.factorio_version;
        return relVer?.startsWith(ver);
      });
    }

    if (options.category && options.category !== 'all') {
      const cat = options.category.toLowerCase();
      filtered = filtered.filter(mod => {
        const modCat = (mod.category || 'no-category').toLowerCase();
        return modCat === cat;
      });
    }

    const sortBy = options.sortBy || 'downloads';
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'downloads':
          return (b.downloads_count || 0) - (a.downloads_count || 0);
        case 'score':
          return (b.score || 0) - (a.score || 0);
        case 'updated':
          return new Date(b.updated_at || b.latest_release?.released_at || 0).getTime() -
                 new Date(a.updated_at || a.latest_release?.released_at || 0).getTime();
        case 'name':
          return (a.title || a.name).localeCompare(b.title || b.name);
        default:
          return (b.downloads_count || 0) - (a.downloads_count || 0);
      }
    });

    const page = Math.max(1, options.page || 1);
    const pageSize = Math.max(5, Math.min(100, options.pageSize || 25));
    const total = filtered.length;
    const pageCount = Math.ceil(total / pageSize);
    const start = (page - 1) * pageSize;
    const items = filtered.slice(start, start + pageSize);

    // 1. Apply any cached thumbnails immediately
    for (const item of items) {
      if (!item.thumbnail && this.thumbnailMap[item.name.toLowerCase()]) {
        item.thumbnail = this.thumbnailMap[item.name.toLowerCase()];
      }
    }

    // 2. Concurrently fetch thumbnails for current page items missing them
    const missing = items.filter(m => !m.thumbnail);
    if (missing.length > 0) {
      let updated = false;
      await Promise.all(missing.map(async (mod) => {
        try {
          const details = await this.getModDetails(mod.name);
          if (details?.thumbnail) {
            mod.thumbnail = details.thumbnail;
            this.thumbnailMap[mod.name.toLowerCase()] = details.thumbnail;
            updated = true;
          }
        } catch {}
      }));

      if (updated && this.thumbnailsFilePath) {
        fs.writeFile(this.thumbnailsFilePath, JSON.stringify(this.thumbnailMap), () => {});
      }
    }

    return { items, total, page, pageCount };
  }

  /**
   * Get full details for a single mod
   */
  static async getModDetails(name: string): Promise<ModItem | null> {
    const cached = this.modDetailsCache.get(name);
    if (cached && (Date.now() - cached.timestamp) < this.CACHE_TTL_MS) {
      return cached.data;
    }

    try {
      const res = await fetch(`https://mods.factorio.com/api/mods/${encodeURIComponent(name)}/full`, {
        headers: { 'User-Agent': 'FactorioModManager/1.0 (r2modman-style)' }
      });

      if (res.ok) {
        const data = await res.json() as ModItem;
        this.modDetailsCache.set(name, { data, timestamp: Date.now() });
        if (data.thumbnail) {
          this.thumbnailMap[name.toLowerCase()] = data.thumbnail;
          if (this.thumbnailsFilePath) {
            fs.writeFile(this.thumbnailsFilePath, JSON.stringify(this.thumbnailMap), () => {});
          }
        }
        return data;
      }

      console.log(`[ModPortalService] Primary portal failed (${res.status}), trying re146 fallback for ${name}...`);
      const fallbackRes = await fetch(`https://re146.dev/factorio/mods/modinfo?id=${encodeURIComponent(name)}`, {
        headers: { 'User-Agent': 'FactorioModManager/1.0 (r2modman-style)' }
      });

      if (fallbackRes.ok) {
        const data = await fallbackRes.json() as ModItem;
        this.modDetailsCache.set(name, { data, timestamp: Date.now() });
        if (data.thumbnail) {
          this.thumbnailMap[name.toLowerCase()] = data.thumbnail;
          if (this.thumbnailsFilePath) {
            fs.writeFile(this.thumbnailsFilePath, JSON.stringify(this.thumbnailMap), () => {});
          }
        }
        return data;
      }
    } catch (err) {
      console.error(`[ModPortalService] Error getting mod details for ${name}:`, err);
    }

    return null;
  }
}
