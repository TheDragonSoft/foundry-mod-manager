var He = Object.defineProperty;
var ze = (u, e, n) => e in u ? He(u, e, { enumerable: !0, configurable: !0, writable: !0, value: n }) : u[e] = n;
var b = (u, e, n) => ze(u, typeof e != "symbol" ? e + "" : e, n);
import { app as W, BrowserWindow as Te, ipcMain as M, Menu as je, shell as $e, dialog as me } from "electron";
import T from "path";
import N from "fs";
import { fileURLToPath as Ge } from "node:url";
import Re from "crypto";
import Me from "zlib";
import { spawn as Ee } from "child_process";
class H {
  /**
   * Initialize with data directory path. Load cached catalog from disk if available.
   */
  static init(e) {
    this.cacheFilePath = T.join(e, "mod_catalog_cache.json"), this.thumbnailsFilePath = T.join(e, "mod_thumbnails_cache.json");
    try {
      if (N.existsSync(this.thumbnailsFilePath)) {
        const n = N.readFileSync(this.thumbnailsFilePath, "utf-8");
        this.thumbnailMap = JSON.parse(n), console.log(`[ModPortalService] Loaded ${Object.keys(this.thumbnailMap).length} cached mod thumbnails.`);
      }
    } catch (n) {
      console.warn("[ModPortalService] Failed to load thumbnails cache:", n);
    }
    try {
      if (N.existsSync(this.cacheFilePath)) {
        const n = N.readFileSync(this.cacheFilePath, "utf-8"), i = JSON.parse(n);
        Array.isArray(i.results) && (this.catalogCache = i.results, this.lastCatalogFetch = i.timestamp || Date.now(), console.log(`[ModPortalService] Loaded ${this.catalogCache.length} mods from local disk cache.`));
      }
    } catch (n) {
      console.warn("[ModPortalService] Failed to load disk cache:", n);
    }
  }
  static getThumbnail(e) {
    return this.thumbnailMap[e.toLowerCase()] || this.thumbnailMap[e];
  }
  /**
   * Fetch complete catalog from official portal, with fallback
   */
  static async getCatalog(e = !1) {
    if (!e && this.catalogCache.length > 0 && Date.now() - this.lastCatalogFetch < this.CACHE_TTL_MS)
      return this.catalogCache;
    if (this.isFetchingCatalog)
      return this.catalogCache;
    this.isFetchingCatalog = !0;
    try {
      console.log("[ModPortalService] Fetching full catalog from mods.factorio.com/api/mods?page_size=max...");
      const i = await fetch("https://mods.factorio.com/api/mods?page_size=max", {
        headers: { "User-Agent": "FactorioModManager/1.0 (r2modman-style)" }
      });
      if (!i.ok)
        throw new Error(`Failed to fetch catalog: HTTP ${i.status} ${i.statusText}`);
      const c = await i.json();
      if (Array.isArray(c.results)) {
        this.catalogCache = c.results, this.lastCatalogFetch = Date.now();
        const d = T.dirname(this.cacheFilePath);
        N.existsSync(d) || N.mkdirSync(d, { recursive: !0 }), N.writeFile(this.cacheFilePath, JSON.stringify({
          timestamp: this.lastCatalogFetch,
          results: this.catalogCache
        }), () => {
        }), console.log(`[ModPortalService] Successfully indexed ${this.catalogCache.length} mods.`);
      }
    } catch (i) {
      console.error("[ModPortalService] Error fetching catalog:", i);
    } finally {
      this.isFetchingCatalog = !1;
    }
    return this.catalogCache;
  }
  /**
   * Search, filter, and paginate through the cached catalog
   */
  static async searchMods(e) {
    var h;
    let i = await this.getCatalog();
    const c = (h = e.query) == null ? void 0 : h.trim().toLowerCase();
    if (c && (i = i.filter((p) => p.name && p.name.toLowerCase().includes(c) || p.title && p.title.toLowerCase().includes(c) || p.owner && p.owner.toLowerCase().includes(c) || p.summary && p.summary.toLowerCase().includes(c))), e.tag) {
      const p = e.tag.toLowerCase();
      i = i.filter((I) => {
        var w, L;
        if (p === "space-age") {
          const s = (((L = (w = I.latest_release) == null ? void 0 : w.info_json) == null ? void 0 : L.dependencies) || []).some((m) => m.toLowerCase().includes("space-age")), r = `${I.name} ${I.title} ${I.summary || ""}`.toLowerCase();
          return s || r.includes("space-age") || r.includes("space age");
        }
        return `${I.name} ${I.title} ${I.summary || ""}`.toLowerCase().includes(p);
      });
    }
    if (e.factorioVersion && e.factorioVersion !== "all") {
      const p = e.factorioVersion;
      i = i.filter((I) => {
        var w, L;
        const C = (L = (w = I.latest_release) == null ? void 0 : w.info_json) == null ? void 0 : L.factorio_version;
        return C == null ? void 0 : C.startsWith(p);
      });
    }
    if (e.category && e.category !== "all") {
      const p = e.category.toLowerCase();
      i = i.filter((I) => (I.category || "no-category").toLowerCase() === p);
    }
    const d = e.sortBy || "downloads";
    i = [...i].sort((p, I) => {
      var C, w;
      switch (d) {
        case "downloads":
          return (I.downloads_count || 0) - (p.downloads_count || 0);
        case "score":
          return (I.score || 0) - (p.score || 0);
        case "updated":
          return new Date(I.updated_at || ((C = I.latest_release) == null ? void 0 : C.released_at) || 0).getTime() - new Date(p.updated_at || ((w = p.latest_release) == null ? void 0 : w.released_at) || 0).getTime();
        case "name":
          return (p.title || p.name).localeCompare(I.title || I.name);
        default:
          return (I.downloads_count || 0) - (p.downloads_count || 0);
      }
    });
    const f = Math.max(1, e.page || 1), E = Math.max(5, Math.min(100, e.pageSize || 25)), t = i.length, a = Math.ceil(t / E), D = (f - 1) * E, y = i.slice(D, D + E);
    for (const p of y)
      !p.thumbnail && this.thumbnailMap[p.name.toLowerCase()] && (p.thumbnail = this.thumbnailMap[p.name.toLowerCase()]);
    const S = y.filter((p) => !p.thumbnail);
    if (S.length > 0) {
      let p = !1;
      await Promise.all(S.map(async (I) => {
        try {
          const C = await this.getModDetails(I.name);
          C != null && C.thumbnail && (I.thumbnail = C.thumbnail, this.thumbnailMap[I.name.toLowerCase()] = C.thumbnail, p = !0);
        } catch {
        }
      })), p && this.thumbnailsFilePath && N.writeFile(this.thumbnailsFilePath, JSON.stringify(this.thumbnailMap), () => {
      });
    }
    return { items: y, total: t, page: f, pageCount: a };
  }
  /**
   * Get full details for a single mod
   */
  static async getModDetails(e) {
    const n = this.modDetailsCache.get(e);
    if (n && Date.now() - n.timestamp < this.CACHE_TTL_MS)
      return n.data;
    try {
      const i = await fetch(`https://mods.factorio.com/api/mods/${encodeURIComponent(e)}/full`, {
        headers: { "User-Agent": "FactorioModManager/1.0 (r2modman-style)" }
      });
      if (i.ok) {
        const d = await i.json();
        return this.modDetailsCache.set(e, { data: d, timestamp: Date.now() }), d.thumbnail && (this.thumbnailMap[e.toLowerCase()] = d.thumbnail, this.thumbnailsFilePath && N.writeFile(this.thumbnailsFilePath, JSON.stringify(this.thumbnailMap), () => {
        })), d;
      }
      console.log(`[ModPortalService] Primary portal failed (${i.status}), trying re146 fallback for ${e}...`);
      const c = await fetch(`https://re146.dev/factorio/mods/modinfo?id=${encodeURIComponent(e)}`, {
        headers: { "User-Agent": "FactorioModManager/1.0 (r2modman-style)" }
      });
      if (c.ok) {
        const d = await c.json();
        return this.modDetailsCache.set(e, { data: d, timestamp: Date.now() }), d.thumbnail && (this.thumbnailMap[e.toLowerCase()] = d.thumbnail, this.thumbnailsFilePath && N.writeFile(this.thumbnailsFilePath, JSON.stringify(this.thumbnailMap), () => {
        })), d;
      }
    } catch (i) {
      console.error(`[ModPortalService] Error getting mod details for ${e}:`, i);
    }
    return null;
  }
}
b(H, "catalogCache", []), b(H, "lastCatalogFetch", 0), b(H, "CACHE_TTL_MS", 900 * 1e3), // 15 minutes
b(H, "isFetchingCatalog", !1), b(H, "cacheFilePath", ""), b(H, "thumbnailsFilePath", ""), b(H, "thumbnailMap", {}), b(H, "modDetailsCache", /* @__PURE__ */ new Map());
class q {
  static parseDependencyString(e) {
    const n = e.trim(), i = /^((?:)|(?:\?)|(?:\(\?\))|(?:!)|(?:~))(?:\s*)([a-zA-Z0-9_-]+)(?:\s*)((?:>=|<=|==|=|>|<)?)(?:\s*)([0-9]+(?:\.[0-9]+)*)?$/i, c = n.match(i);
    if (!c)
      return {
        id: n.replace(/[?!~()=><]/g, "").trim(),
        type: "required",
        ineq: "",
        version: "",
        raw: n
      };
    const d = c[1], f = c[2], E = c[3] === "==" ? "=" : c[3] || "", t = c[4] || "";
    let a = "required";
    return d === "?" ? a = "optional" : d === "(?)" ? a = "hidden_optional" : d === "!" ? a = "incompatible" : d === "~" && (a = "order_only"), { id: f, type: a, ineq: E, version: t, raw: n };
  }
  static parseDependencies(e = []) {
    return e.map((n) => this.parseDependencyString(n));
  }
  static compareVersions(e, n) {
    const i = e.split(".").map(Number), c = n.split(".").map(Number), d = Math.max(i.length, c.length);
    for (let f = 0; f < d; f++) {
      const E = i[f] || 0, t = c[f] || 0;
      if (E > t) return 1;
      if (E < t) return -1;
    }
    return 0;
  }
  static satisfies(e, n, i) {
    if (!n || !i) return !0;
    const c = this.compareVersions(e, i);
    switch (n) {
      case ">=":
        return c >= 0;
      case "<=":
        return c <= 0;
      case ">":
        return c > 0;
      case "<":
        return c < 0;
      case "=":
      case "==":
        return c === 0;
      default:
        return !0;
    }
  }
  static isBuiltin(e) {
    return this.BUILTIN_PACKAGES.has(e.toLowerCase());
  }
}
// Built-in base factorio packages that are part of the game/DLC
b(q, "BUILTIN_PACKAGES", /* @__PURE__ */ new Set(["base", "core", "elevated-rails", "quality", "space-age"]));
class G {
  static subscribe(e) {
    return this.listeners.push(e), () => {
      this.listeners = this.listeners.filter((n) => n !== e);
    };
  }
  static emitProgress(e) {
    this.activeDownloads.set(`${e.modName}@${e.version}`, e), this.listeners.forEach((n) => n(e));
  }
  static getActiveDownloads() {
    return Array.from(this.activeDownloads.values());
  }
  /**
   * Download a single mod archive from the re146 mirror
   */
  static async downloadModFile(e, n, i, c) {
    var L;
    const d = `${this.primaryMirror}${encodeURIComponent(e)}/${encodeURIComponent(n)}.zip`, f = `${e}_${n}.zip`, E = T.join(i, f);
    if (N.existsSync(E) && N.statSync(E).size > 0)
      return E;
    N.existsSync(i) || N.mkdirSync(i, { recursive: !0 }), this.emitProgress({
      modName: e,
      version: n,
      title: e,
      status: "downloading",
      progress: 0,
      downloadedBytes: 0,
      totalBytes: 0,
      speed: "Connecting..."
    }), console.log(`[DownloadService] Fetching ${e} v${n} from ${d}...`);
    const t = await fetch(d);
    if (!t.ok) {
      const _ = `Failed to download: HTTP ${t.status} ${t.statusText}`;
      throw this.emitProgress({
        modName: e,
        version: n,
        title: e,
        status: "error",
        progress: 0,
        downloadedBytes: 0,
        totalBytes: 0,
        speed: "0 KB/s",
        error: _
      }), new Error(_);
    }
    const a = parseInt(t.headers.get("content-length") || "0", 10), D = `${E}.tmp.${Date.now()}`, y = N.createWriteStream(D), S = Re.createHash("sha1");
    let h = 0, p = Date.now(), I = 0, C = "0 KB/s";
    const w = (L = t.body) == null ? void 0 : L.getReader();
    if (!w)
      throw new Error("Response body is null");
    try {
      for (; ; ) {
        const { done: s, value: r } = await w.read();
        if (s) break;
        if (r) {
          y.write(Buffer.from(r)), S.update(r), h += r.length, I += r.length;
          const m = Date.now(), o = m - p;
          if (o >= 500) {
            const l = I / o * 1e3;
            C = l > 1024 * 1024 ? `${(l / (1024 * 1024)).toFixed(1)} MB/s` : `${(l / 1024).toFixed(0)} KB/s`, I = 0, p = m;
            const g = a > 0 ? Math.min(99, Math.round(h / a * 100)) : 50;
            this.emitProgress({
              modName: e,
              version: n,
              title: e,
              status: "downloading",
              progress: g,
              downloadedBytes: h,
              totalBytes: a,
              speed: C
            });
          }
        }
      }
      await new Promise((s, r) => {
        y.end(() => s()), y.on("error", r);
      });
      const _ = S.digest("hex");
      return c && c.toLowerCase() !== _.toLowerCase() && console.warn(`[DownloadService] SHA1 mismatch for ${e} v${n}. Expected: ${c}, got: ${_}`), N.existsSync(E) && N.unlinkSync(E), N.renameSync(D, E), this.emitProgress({
        modName: e,
        version: n,
        title: e,
        status: "completed",
        progress: 100,
        downloadedBytes: h,
        totalBytes: h,
        speed: "Finished"
      }), console.log(`[DownloadService] Successfully downloaded ${f}`), E;
    } catch (_) {
      if (N.existsSync(D))
        try {
          N.unlinkSync(D);
        } catch {
        }
      throw this.emitProgress({
        modName: e,
        version: n,
        title: e,
        status: "error",
        progress: 0,
        downloadedBytes: h,
        totalBytes: a,
        speed: "0 KB/s",
        error: (_ == null ? void 0 : _.message) || "Download failed"
      }), _;
    }
  }
  /**
   * Recursively resolve and download mod with all its required dependencies
   */
  static async installModWithDependencies(e, n, i, c, d = /* @__PURE__ */ new Set()) {
    var I;
    const f = [], E = [], t = await H.getModDetails(e);
    if (!t)
      return E.push(`Could not fetch details for mod "${e}" from portal.`), { installed: f, errors: E };
    const a = t.releases || (t.latest_release ? [t.latest_release] : []);
    if (a.length === 0)
      return E.push(`No releases found for mod "${e}".`), { installed: f, errors: E };
    let D = a[a.length - 1];
    if (n) {
      const C = a.find((w) => w.version === n);
      C && (D = C);
    }
    const y = D.version, S = `${e}@${y}`;
    if (d.has(S))
      return { installed: f, errors: E };
    d.add(S);
    const h = ((I = D.info_json) == null ? void 0 : I.dependencies) || [], p = q.parseDependencies(h);
    for (const C of p)
      if (C.type === "required" && !q.isBuiltin(C.id)) {
        const w = c.find((_) => _.name.toLowerCase() === C.id.toLowerCase());
        if (!(w && (!C.version || q.satisfies(w.version, C.ineq, C.version)))) {
          console.log(`[DownloadService] Resolving required dependency for ${e}: ${C.id} (${C.ineq} ${C.version})...`);
          const _ = await this.installModWithDependencies(
            C.id,
            C.version || void 0,
            i,
            c,
            d
          );
          f.push(..._.installed), E.push(..._.errors);
        }
      }
    try {
      await this.downloadModFile(e, y, i, D.sha1), f.push({ name: e, version: y });
    } catch (C) {
      E.push(`Failed to download ${e} v${y}: ${C == null ? void 0 : C.message}`);
    }
    return { installed: f, errors: E };
  }
}
b(G, "activeDownloads", /* @__PURE__ */ new Map()), b(G, "listeners", []), b(G, "primaryMirror", "https://mods-storage.re146.dev/");
function Ve(u) {
  return u && u.__esModule && Object.prototype.hasOwnProperty.call(u, "default") ? u.default : u;
}
var V = { exports: {} }, ee, ge;
function Ue() {
  return ge || (ge = 1, ee = {
    /* The local file header */
    LOCHDR: 30,
    // LOC header size
    LOCSIG: 67324752,
    // "PK\003\004"
    LOCVER: 4,
    // version needed to extract
    LOCFLG: 6,
    // general purpose bit flag
    LOCHOW: 8,
    // compression method
    LOCTIM: 10,
    // modification time (2 bytes time, 2 bytes date)
    LOCCRC: 14,
    // uncompressed file crc-32 value
    LOCSIZ: 18,
    // compressed size
    LOCLEN: 22,
    // uncompressed size
    LOCNAM: 26,
    // filename length
    LOCEXT: 28,
    // extra field length
    /* The Data descriptor */
    EXTSIG: 134695760,
    // "PK\007\008"
    EXTHDR: 16,
    // EXT header size
    EXTCRC: 4,
    // uncompressed file crc-32 value
    EXTSIZ: 8,
    // compressed size
    EXTLEN: 12,
    // uncompressed size
    /* The central directory file header */
    CENHDR: 46,
    // CEN header size
    CENSIG: 33639248,
    // "PK\001\002"
    CENVEM: 4,
    // version made by
    CENVER: 6,
    // version needed to extract
    CENFLG: 8,
    // encrypt, decrypt flags
    CENHOW: 10,
    // compression method
    CENTIM: 12,
    // modification time (2 bytes time, 2 bytes date)
    CENCRC: 16,
    // uncompressed file crc-32 value
    CENSIZ: 20,
    // compressed size
    CENLEN: 24,
    // uncompressed size
    CENNAM: 28,
    // filename length
    CENEXT: 30,
    // extra field length
    CENCOM: 32,
    // file comment length
    CENDSK: 34,
    // volume number start
    CENATT: 36,
    // internal file attributes
    CENATX: 38,
    // external file attributes (host system dependent)
    CENOFF: 42,
    // LOC header offset
    /* The entries in the end of central directory */
    ENDHDR: 22,
    // END header size
    ENDSIG: 101010256,
    // "PK\005\006"
    ENDSUB: 8,
    // number of entries on this disk
    ENDTOT: 10,
    // total number of entries
    ENDSIZ: 12,
    // central directory size in bytes
    ENDOFF: 16,
    // offset of first CEN header
    ENDCOM: 20,
    // zip file comment length
    END64HDR: 20,
    // zip64 END header size
    END64SIG: 117853008,
    // zip64 Locator signature, "PK\006\007"
    END64START: 4,
    // number of the disk with the start of the zip64
    END64OFF: 8,
    // relative offset of the zip64 end of central directory
    END64NUMDISKS: 16,
    // total number of disks
    ZIP64SIG: 101075792,
    // zip64 signature, "PK\006\006"
    ZIP64HDR: 56,
    // zip64 record minimum size
    ZIP64LEAD: 12,
    // leading bytes at the start of the record, not counted by the value stored in ZIP64SIZE
    ZIP64SIZE: 4,
    // zip64 size of the central directory record
    ZIP64VEM: 12,
    // zip64 version made by
    ZIP64VER: 14,
    // zip64 version needed to extract
    ZIP64DSK: 16,
    // zip64 number of this disk
    ZIP64DSKDIR: 20,
    // number of the disk with the start of the record directory
    ZIP64SUB: 24,
    // number of entries on this disk
    ZIP64TOT: 32,
    // total number of entries
    ZIP64SIZB: 40,
    // zip64 central directory size in bytes
    ZIP64OFF: 48,
    // offset of start of central directory with respect to the starting disk number
    ZIP64EXTRA: 56,
    // extensible data sector
    /* Compression methods */
    STORED: 0,
    // no compression
    SHRUNK: 1,
    // shrunk
    REDUCED1: 2,
    // reduced with compression factor 1
    REDUCED2: 3,
    // reduced with compression factor 2
    REDUCED3: 4,
    // reduced with compression factor 3
    REDUCED4: 5,
    // reduced with compression factor 4
    IMPLODED: 6,
    // imploded
    // 7 reserved for Tokenizing compression algorithm
    DEFLATED: 8,
    // deflated
    ENHANCED_DEFLATED: 9,
    // enhanced deflated
    PKWARE: 10,
    // PKWare DCL imploded
    // 11 reserved by PKWARE
    BZIP2: 12,
    //  compressed using BZIP2
    // 13 reserved by PKWARE
    LZMA: 14,
    // LZMA
    // 15-17 reserved by PKWARE
    IBM_TERSE: 18,
    // compressed using IBM TERSE
    IBM_LZ77: 19,
    // IBM LZ77 z
    AES_ENCRYPT: 99,
    // WinZIP AES encryption method
    /* General purpose bit flag */
    // values can obtained with expression 2**bitnr
    FLG_ENC: 1,
    // Bit 0: encrypted file
    FLG_COMP1: 2,
    // Bit 1, compression option
    FLG_COMP2: 4,
    // Bit 2, compression option
    FLG_DESC: 8,
    // Bit 3, data descriptor
    FLG_ENH: 16,
    // Bit 4, enhanced deflating
    FLG_PATCH: 32,
    // Bit 5, indicates that the file is compressed patched data.
    FLG_STR: 64,
    // Bit 6, strong encryption (patented)
    // Bits 7-10: Currently unused.
    FLG_EFS: 2048,
    // Bit 11: Language encoding flag (EFS)
    // Bit 12: Reserved by PKWARE for enhanced compression.
    // Bit 13: encrypted the Central Directory (patented).
    // Bits 14-15: Reserved by PKWARE.
    FLG_MSK: 4096,
    // mask header values
    /* Load type */
    FILE: 2,
    BUFFER: 1,
    NONE: 0,
    /* 4.5 Extensible data fields */
    EF_ID: 0,
    EF_SIZE: 2,
    /* Header IDs */
    ID_ZIP64: 1,
    ID_AVINFO: 7,
    ID_PFS: 8,
    ID_OS2: 9,
    ID_NTFS: 10,
    ID_OPENVMS: 12,
    ID_UNIX: 13,
    ID_FORK: 14,
    ID_PATCH: 15,
    ID_X509_PKCS7: 20,
    ID_X509_CERTID_F: 21,
    ID_X509_CERTID_C: 22,
    ID_STRONGENC: 23,
    ID_RECORD_MGT: 24,
    ID_X509_PKCS7_RL: 25,
    ID_IBM1: 101,
    ID_IBM2: 102,
    ID_POSZIP: 18064,
    EF_ZIP64_OR_32: 4294967295,
    EF_ZIP64_OR_16: 65535,
    EF_ZIP64_SUNCOMP: 0,
    EF_ZIP64_SCOMP: 8,
    EF_ZIP64_RHO: 16,
    EF_ZIP64_DSN: 24
  }), ee;
}
var te = {}, pe;
function he() {
  return pe || (pe = 1, (function(u) {
    const e = {
      /* Header error messages */
      INVALID_LOC: "Invalid LOC header (bad signature)",
      INVALID_CEN: "Invalid CEN header (bad signature)",
      INVALID_END: "Invalid END header (bad signature)",
      /* Descriptor */
      DESCRIPTOR_NOT_EXIST: "No descriptor present",
      DESCRIPTOR_UNKNOWN: "Unknown descriptor format",
      DESCRIPTOR_FAULTY: "Descriptor data is malformed",
      /* ZipEntry error messages*/
      NO_DATA: "Nothing to decompress",
      BAD_CRC: "CRC32 checksum failed {0}",
      FILE_IN_THE_WAY: "There is a file in the way: {0}",
      UNKNOWN_METHOD: "Invalid/unsupported compression method",
      /* Inflater error messages */
      AVAIL_DATA: "inflate::Available inflate data did not terminate",
      INVALID_DISTANCE: "inflate::Invalid literal/length or distance code in fixed or dynamic block",
      TO_MANY_CODES: "inflate::Dynamic block code description: too many length or distance codes",
      INVALID_REPEAT_LEN: "inflate::Dynamic block code description: repeat more than specified lengths",
      INVALID_REPEAT_FIRST: "inflate::Dynamic block code description: repeat lengths with no first length",
      INCOMPLETE_CODES: "inflate::Dynamic block code description: code lengths codes incomplete",
      INVALID_DYN_DISTANCE: "inflate::Dynamic block code description: invalid distance code lengths",
      INVALID_CODES_LEN: "inflate::Dynamic block code description: invalid literal/length code lengths",
      INVALID_STORE_BLOCK: "inflate::Stored block length did not match one's complement",
      INVALID_BLOCK_TYPE: "inflate::Invalid block type (type == 3)",
      /* ADM-ZIP error messages */
      CANT_EXTRACT_FILE: "Could not extract the file",
      CANT_OVERRIDE: "Target file already exists",
      DISK_ENTRY_TOO_LARGE: "Number of disk entries is too large",
      NO_ZIP: "No zip file was loaded",
      NO_ENTRY: "Entry doesn't exist",
      DIRECTORY_CONTENT_ERROR: "A directory cannot have content",
      FILE_NOT_FOUND: 'File not found: "{0}"',
      NOT_IMPLEMENTED: "Not implemented",
      INVALID_FILENAME: "Invalid filename",
      INVALID_FORMAT: "Invalid or unsupported zip format. No END header found",
      INVALID_PASS_PARAM: "Incompatible password parameter",
      WRONG_PASSWORD: "Wrong Password",
      /* ADM-ZIP */
      COMMENT_TOO_LONG: "Comment is too long",
      // Comment can be max 65535 bytes long (NOTE: some non-US characters may take more space)
      EXTRA_FIELD_PARSE_ERROR: "Extra field parsing error"
    };
    function n(i) {
      return function(...c) {
        return c.length && (i = i.replace(/\{(\d)\}/g, (d, f) => c[f] || "")), new Error("ADM-ZIP: " + i);
      };
    }
    for (const i of Object.keys(e))
      u[i] = n(e[i]);
  })(te)), te;
}
var ne, ye;
function qe() {
  if (ye) return ne;
  ye = 1;
  const u = N, e = T, n = Ue(), i = he(), c = typeof process == "object" && process.platform === "win32", d = (t) => typeof t == "object" && t !== null, f = new Uint32Array(256).map((t, a) => {
    for (let D = 0; D < 8; D++)
      (a & 1) !== 0 ? a = 3988292384 ^ a >>> 1 : a >>>= 1;
    return a >>> 0;
  });
  function E(t) {
    this.sep = e.sep, this.fs = u, d(t) && d(t.fs) && typeof t.fs.statSync == "function" && (this.fs = t.fs);
  }
  return ne = E, E.prototype.makeDir = function(t) {
    const a = this;
    function D(y) {
      let S = y.split(a.sep)[0];
      y.split(a.sep).forEach(function(h) {
        if (!(!h || h.substr(-1, 1) === ":")) {
          S += a.sep + h;
          var p;
          try {
            p = a.fs.statSync(S);
          } catch (I) {
            if (I.message && I.message.startsWith("ENOENT"))
              a.fs.mkdirSync(S);
            else
              throw I;
          }
          if (p && p.isFile()) throw i.FILE_IN_THE_WAY(`"${S}"`);
        }
      });
    }
    D(t);
  }, E.prototype.writeFileTo = function(t, a, D, y) {
    const S = this;
    if (S.fs.existsSync(t)) {
      if (!D) return !1;
      var h = S.fs.statSync(t);
      if (h.isDirectory())
        return !1;
    }
    var p = e.dirname(t);
    S.fs.existsSync(p) || S.makeDir(p);
    var I;
    try {
      I = S.fs.openSync(t, "w", 438);
    } catch {
      S.fs.chmodSync(t, 438), I = S.fs.openSync(t, "w", 438);
    }
    if (I)
      try {
        S.fs.writeSync(I, a, 0, a.length, 0);
      } finally {
        S.fs.closeSync(I);
      }
    return S.fs.chmodSync(t, y || 438), !0;
  }, E.prototype.writeFileToAsync = function(t, a, D, y, S) {
    typeof y == "function" && (S = y, y = void 0);
    const h = this;
    h.fs.exists(t, function(p) {
      if (p && !D) return S(!1);
      h.fs.stat(t, function(I, C) {
        if (p && C.isDirectory())
          return S(!1);
        var w = e.dirname(t);
        h.fs.exists(w, function(L) {
          L || h.makeDir(w), h.fs.open(t, "w", 438, function(_, s) {
            _ ? h.fs.chmod(t, 438, function() {
              h.fs.open(t, "w", 438, function(r, m) {
                h.fs.write(m, a, 0, a.length, 0, function() {
                  h.fs.close(m, function() {
                    h.fs.chmod(t, y || 438, function() {
                      S(!0);
                    });
                  });
                });
              });
            }) : s ? h.fs.write(s, a, 0, a.length, 0, function() {
              h.fs.close(s, function() {
                h.fs.chmod(t, y || 438, function() {
                  S(!0);
                });
              });
            }) : h.fs.chmod(t, y || 438, function() {
              S(!0);
            });
          });
        });
      });
    });
  }, E.prototype.findFiles = function(t) {
    const a = this;
    function D(y, S, h) {
      let p = [];
      return a.fs.readdirSync(y).forEach(function(I) {
        const C = e.join(y, I), w = a.fs.statSync(C);
        p.push(e.normalize(C) + (w.isDirectory() ? a.sep : "")), w.isDirectory() && h && (p = p.concat(D(C, S, h)));
      }), p;
    }
    return D(t, void 0, !0);
  }, E.prototype.findFilesAsync = function(t, a) {
    const D = this;
    let y = [];
    D.fs.readdir(t, function(S, h) {
      if (S) return a(S);
      let p = h.length;
      if (!p) return a(null, y);
      h.forEach(function(I) {
        I = e.join(t, I), D.fs.stat(I, function(C, w) {
          if (C) return a(C);
          w && (y.push(e.normalize(I) + (w.isDirectory() ? D.sep : "")), w.isDirectory() ? D.findFilesAsync(I, function(L, _) {
            if (L) return a(L);
            y = y.concat(_), --p || a(null, y);
          }) : --p || a(null, y));
        });
      });
    });
  }, E.prototype.getAttributes = function() {
  }, E.prototype.setAttributes = function() {
  }, E.crc32update = function(t, a) {
    return f[(t ^ a) & 255] ^ t >>> 8;
  }, E.crc32 = function(t) {
    typeof t == "string" && (t = Buffer.from(t, "utf8"));
    let a = t.length, D = -1;
    for (let y = 0; y < a; ) D = E.crc32update(D, t[y++]);
    return ~D >>> 0;
  }, E.methodToString = function(t) {
    switch (t) {
      case n.STORED:
        return "STORED (" + t + ")";
      case n.DEFLATED:
        return "DEFLATED (" + t + ")";
      default:
        return "UNSUPPORTED (" + t + ")";
    }
  }, E.canonical = function(t) {
    if (!t) return "";
    const a = e.posix.normalize("/" + t.split("\\").join("/"));
    return e.join(".", a);
  }, E.zipnamefix = function(t) {
    if (!t) return "";
    const a = e.posix.normalize("/" + t.split("\\").join("/"));
    return e.posix.join(".", a);
  }, E.findLast = function(t, a) {
    if (!Array.isArray(t)) throw new TypeError("arr is not array");
    const D = t.length >>> 0;
    for (let y = D - 1; y >= 0; y--)
      if (a(t[y], y, t))
        return t[y];
  }, E.sanitize = function(t, a) {
    t = e.resolve(e.normalize(t));
    for (var D = a.split("/"), y = 0, S = D.length; y < S; y++) {
      var h = e.normalize(e.join(t, D.slice(y, S).join(e.sep)));
      if (h === t || h.startsWith(t + e.sep))
        return h;
    }
    return e.normalize(e.join(t, e.basename(a)));
  }, E.toBuffer = function(a, D) {
    return Buffer.isBuffer(a) ? a : a instanceof Uint8Array ? Buffer.from(a) : typeof a == "string" ? D(a) : Buffer.alloc(0);
  }, E.readBigUInt64LE = function(t, a) {
    const D = t.readUInt32LE(a);
    return t.readUInt32LE(a + 4) * 4294967296 + D;
  }, E.writeBigUInt64LE = function(t, a, D) {
    const y = a >>> 0, S = Math.floor(a / 4294967296) >>> 0;
    t.writeUInt32LE(y, D), t.writeUInt32LE(S, D + 4);
  }, E.fromDOS2Date = function(t) {
    return new Date((t >> 25 & 127) + 1980, Math.max((t >> 21 & 15) - 1, 0), Math.max(t >> 16 & 31, 1), t >> 11 & 31, t >> 5 & 63, (t & 31) << 1);
  }, E.fromDate2DOS = function(t) {
    let a = 0, D = 0;
    return t.getFullYear() > 1979 && (a = (t.getFullYear() - 1980 & 127) << 9 | t.getMonth() + 1 << 5 | t.getDate(), D = t.getHours() << 11 | t.getMinutes() << 5 | t.getSeconds() >> 1), a << 16 | D;
  }, E.isWin = c, E.crcTable = f, ne;
}
var re, De;
function We() {
  if (De) return re;
  De = 1;
  const u = T;
  return re = function(e, { fs: n }) {
    var i = e || "", c = f(), d = null;
    function f() {
      return {
        directory: !1,
        readonly: !1,
        hidden: !1,
        executable: !1,
        mtime: 0,
        atime: 0
      };
    }
    return i && n.existsSync(i) ? (d = n.statSync(i), c.directory = d.isDirectory(), c.mtime = d.mtime, c.atime = d.atime, c.executable = (73 & d.mode) !== 0, c.readonly = (128 & d.mode) === 0, c.hidden = u.basename(i)[0] === ".") : console.warn("Invalid path: " + i), {
      get directory() {
        return c.directory;
      },
      get readOnly() {
        return c.readonly;
      },
      get hidden() {
        return c.hidden;
      },
      get mtime() {
        return c.mtime;
      },
      get atime() {
        return c.atime;
      },
      get executable() {
        return c.executable;
      },
      decodeAttributes: function() {
      },
      encodeAttributes: function() {
      },
      toJSON: function() {
        return {
          path: i,
          isDirectory: c.directory,
          isReadOnly: c.readonly,
          isHidden: c.hidden,
          isExecutable: c.executable,
          mTime: c.mtime,
          aTime: c.atime
        };
      },
      toString: function() {
        return JSON.stringify(this.toJSON(), null, "	");
      }
    };
  }, re;
}
var ie, Ie;
function Je() {
  return Ie || (Ie = 1, ie = {
    efs: !0,
    encode: (u) => Buffer.from(u, "utf8"),
    decode: (u) => u.toString("utf8")
  }), ie;
}
var Se;
function K() {
  return Se || (Se = 1, V.exports = qe(), V.exports.Constants = Ue(), V.exports.Errors = he(), V.exports.FileAttr = We(), V.exports.decoder = Je()), V.exports;
}
var k = {}, se, Le;
function Xe() {
  if (Le) return se;
  Le = 1;
  var u = K(), e = u.Constants;
  return se = function() {
    var n = 20, i = 10, c = 0, d = 0, f = 0, E = 0, t = 0, a = 0, D = 0, y = 0, S = 0, h = 0, p = 0, I = 0, C = 0;
    n |= u.isWin ? 2560 : 768, c |= e.FLG_EFS;
    const w = {
      extraLen: 0
    }, L = (s) => Math.max(0, s) >>> 0, _ = (s) => Math.max(0, s) & 255;
    return f = u.fromDate2DOS(/* @__PURE__ */ new Date()), {
      get made() {
        return n;
      },
      set made(s) {
        n = s;
      },
      get version() {
        return i;
      },
      set version(s) {
        i = s;
      },
      get flags() {
        return c;
      },
      set flags(s) {
        c = s;
      },
      get flags_efs() {
        return (c & e.FLG_EFS) > 0;
      },
      set flags_efs(s) {
        s ? c |= e.FLG_EFS : c &= ~e.FLG_EFS;
      },
      get flags_desc() {
        return (c & e.FLG_DESC) > 0;
      },
      set flags_desc(s) {
        s ? c |= e.FLG_DESC : c &= ~e.FLG_DESC;
      },
      get method() {
        return d;
      },
      set method(s) {
        switch (s) {
          case e.STORED:
            this.version = 10;
            break;
          case e.DEFLATED:
          default:
            this.version = 20;
        }
        d = s;
      },
      get time() {
        return u.fromDOS2Date(this.timeval);
      },
      set time(s) {
        s = new Date(s), this.timeval = u.fromDate2DOS(s);
      },
      get timeval() {
        return f;
      },
      set timeval(s) {
        f = L(s);
      },
      get timeHighByte() {
        return _(f >>> 8);
      },
      get crc() {
        return E;
      },
      set crc(s) {
        E = L(s);
      },
      get compressedSize() {
        return t;
      },
      set compressedSize(s) {
        t = L(s);
      },
      get size() {
        return a;
      },
      set size(s) {
        a = L(s);
      },
      get fileNameLength() {
        return D;
      },
      set fileNameLength(s) {
        D = s;
      },
      get extraLength() {
        return y;
      },
      set extraLength(s) {
        y = s;
      },
      get extraLocalLength() {
        return w.extraLen;
      },
      set extraLocalLength(s) {
        w.extraLen = s;
      },
      get commentLength() {
        return S;
      },
      set commentLength(s) {
        S = s;
      },
      get diskNumStart() {
        return h;
      },
      set diskNumStart(s) {
        h = L(s);
      },
      get inAttr() {
        return p;
      },
      set inAttr(s) {
        p = L(s);
      },
      get attr() {
        return I;
      },
      set attr(s) {
        I = L(s);
      },
      // get Unix file permissions
      get fileAttr() {
        return (I || 0) >> 16 & 4095;
      },
      get offset() {
        return C;
      },
      set offset(s) {
        C = L(s);
      },
      get encrypted() {
        return (c & e.FLG_ENC) === e.FLG_ENC;
      },
      get centralHeaderSize() {
        return e.CENHDR + D + y + S;
      },
      get realDataOffset() {
        return C + e.LOCHDR + w.fnameLen + w.extraLen;
      },
      get localHeader() {
        return w;
      },
      loadLocalHeaderFromBinary: function(s) {
        var r = s.slice(C, C + e.LOCHDR);
        if (r.readUInt32LE(0) !== e.LOCSIG)
          throw u.Errors.INVALID_LOC();
        w.version = r.readUInt16LE(e.LOCVER), w.flags = r.readUInt16LE(e.LOCFLG), w.flags_desc = (w.flags & e.FLG_DESC) > 0, w.method = r.readUInt16LE(e.LOCHOW), w.time = r.readUInt32LE(e.LOCTIM), w.crc = r.readUInt32LE(e.LOCCRC), w.compressedSize = r.readUInt32LE(e.LOCSIZ), w.size = r.readUInt32LE(e.LOCLEN), w.fnameLen = r.readUInt16LE(e.LOCNAM), w.extraLen = r.readUInt16LE(e.LOCEXT);
        const m = C + e.LOCHDR + w.fnameLen, o = m + w.extraLen;
        return s.slice(m, o);
      },
      loadFromBinary: function(s) {
        if (s.length !== e.CENHDR || s.readUInt32LE(0) !== e.CENSIG)
          throw u.Errors.INVALID_CEN();
        n = s.readUInt16LE(e.CENVEM), i = s.readUInt16LE(e.CENVER), c = s.readUInt16LE(e.CENFLG), d = s.readUInt16LE(e.CENHOW), f = s.readUInt32LE(e.CENTIM), E = s.readUInt32LE(e.CENCRC), t = s.readUInt32LE(e.CENSIZ), a = s.readUInt32LE(e.CENLEN), D = s.readUInt16LE(e.CENNAM), y = s.readUInt16LE(e.CENEXT), S = s.readUInt16LE(e.CENCOM), h = s.readUInt16LE(e.CENDSK), p = s.readUInt16LE(e.CENATT), I = s.readUInt32LE(e.CENATX), C = s.readUInt32LE(e.CENOFF);
      },
      localHeaderToBinary: function() {
        var s = Buffer.alloc(e.LOCHDR);
        return s.writeUInt32LE(e.LOCSIG, 0), s.writeUInt16LE(i, e.LOCVER), s.writeUInt16LE(c & ~e.FLG_DESC, e.LOCFLG), s.writeUInt16LE(d, e.LOCHOW), s.writeUInt32LE(f, e.LOCTIM), s.writeUInt32LE(E, e.LOCCRC), s.writeUInt32LE(t, e.LOCSIZ), s.writeUInt32LE(a, e.LOCLEN), s.writeUInt16LE(D, e.LOCNAM), s.writeUInt16LE(w.extraLen, e.LOCEXT), s;
      },
      centralHeaderToBinary: function() {
        var s = Buffer.alloc(e.CENHDR + D + y + S);
        return s.writeUInt32LE(e.CENSIG, 0), s.writeUInt16LE(n, e.CENVEM), s.writeUInt16LE(i, e.CENVER), s.writeUInt16LE(c & ~e.FLG_DESC, e.CENFLG), s.writeUInt16LE(d, e.CENHOW), s.writeUInt32LE(f, e.CENTIM), s.writeUInt32LE(E, e.CENCRC), s.writeUInt32LE(t, e.CENSIZ), s.writeUInt32LE(a, e.CENLEN), s.writeUInt16LE(D, e.CENNAM), s.writeUInt16LE(y, e.CENEXT), s.writeUInt16LE(S, e.CENCOM), s.writeUInt16LE(h, e.CENDSK), s.writeUInt16LE(p, e.CENATT), s.writeUInt32LE(I, e.CENATX), s.writeUInt32LE(C, e.CENOFF), s;
      },
      toJSON: function() {
        const s = function(r) {
          return r + " bytes";
        };
        return {
          made: n,
          version: i,
          flags: c,
          method: u.methodToString(d),
          time: this.time,
          crc: "0x" + E.toString(16).toUpperCase(),
          compressedSize: s(t),
          size: s(a),
          fileNameLength: s(D),
          extraLength: s(y),
          commentLength: s(S),
          diskNumStart: h,
          inAttr: p,
          attr: I,
          offset: C,
          centralHeaderSize: s(e.CENHDR + D + y + S)
        };
      },
      toString: function() {
        return JSON.stringify(this.toJSON(), null, "	");
      }
    };
  }, se;
}
var oe, Ce;
function Ke() {
  if (Ce) return oe;
  Ce = 1;
  var u = K(), e = u.Constants;
  return oe = function() {
    var n = 0, i = 0, c = 0, d = 0, f = 0;
    const E = () => n > e.EF_ZIP64_OR_16 || i > e.EF_ZIP64_OR_16 || c > e.EF_ZIP64_OR_32 || d > e.EF_ZIP64_OR_32;
    return {
      get diskEntries() {
        return n;
      },
      set diskEntries(t) {
        n = i = t;
      },
      get totalEntries() {
        return i;
      },
      set totalEntries(t) {
        i = n = t;
      },
      get size() {
        return c;
      },
      set size(t) {
        c = t;
      },
      get offset() {
        return d;
      },
      set offset(t) {
        d = t;
      },
      get commentLength() {
        return f;
      },
      set commentLength(t) {
        f = t;
      },
      get mainHeaderSize() {
        return (E() ? e.ZIP64HDR + e.END64HDR : 0) + e.ENDHDR + f;
      },
      loadFromBinary: function(t) {
        if ((t.length !== e.ENDHDR || t.readUInt32LE(0) !== e.ENDSIG) && (t.length < e.ZIP64HDR || t.readUInt32LE(0) !== e.ZIP64SIG))
          throw u.Errors.INVALID_END();
        t.readUInt32LE(0) === e.ENDSIG ? (n = t.readUInt16LE(e.ENDSUB), i = t.readUInt16LE(e.ENDTOT), c = t.readUInt32LE(e.ENDSIZ), d = t.readUInt32LE(e.ENDOFF), f = t.readUInt16LE(e.ENDCOM)) : (n = u.readBigUInt64LE(t, e.ZIP64SUB), i = u.readBigUInt64LE(t, e.ZIP64TOT), c = u.readBigUInt64LE(t, e.ZIP64SIZB), d = u.readBigUInt64LE(t, e.ZIP64OFF), f = 0);
      },
      toBinary: function() {
        if (!E()) {
          var t = Buffer.alloc(e.ENDHDR + f);
          return t.writeUInt32LE(e.ENDSIG, 0), t.writeUInt32LE(0, 4), t.writeUInt16LE(n, e.ENDSUB), t.writeUInt16LE(i, e.ENDTOT), t.writeUInt32LE(c, e.ENDSIZ), t.writeUInt32LE(d, e.ENDOFF), t.writeUInt16LE(f, e.ENDCOM), t.fill(" ", e.ENDHDR), t;
        }
        var t = Buffer.alloc(this.mainHeaderSize);
        let a = 0;
        t.writeUInt32LE(e.ZIP64SIG, a), u.writeBigUInt64LE(t, e.ZIP64HDR - e.ZIP64LEAD, a + e.ZIP64SIZE), t.writeUInt16LE(45, a + e.ZIP64VEM), t.writeUInt16LE(45, a + e.ZIP64VER), t.writeUInt32LE(0, a + e.ZIP64DSK), t.writeUInt32LE(0, a + e.ZIP64DSKDIR), u.writeBigUInt64LE(t, n, a + e.ZIP64SUB), u.writeBigUInt64LE(t, i, a + e.ZIP64TOT), u.writeBigUInt64LE(t, c, a + e.ZIP64SIZB), u.writeBigUInt64LE(t, d, a + e.ZIP64OFF);
        const D = d + c;
        return a += e.ZIP64HDR, t.writeUInt32LE(e.END64SIG, a), t.writeUInt32LE(0, a + e.END64START), u.writeBigUInt64LE(t, D, a + e.END64OFF), t.writeUInt32LE(1, a + e.END64NUMDISKS), a += e.END64HDR, t.writeUInt32LE(e.ENDSIG, a), t.writeUInt32LE(0, a + 4), t.writeUInt16LE(Math.min(n, e.EF_ZIP64_OR_16), a + e.ENDSUB), t.writeUInt16LE(Math.min(i, e.EF_ZIP64_OR_16), a + e.ENDTOT), t.writeUInt32LE(Math.min(c, e.EF_ZIP64_OR_32), a + e.ENDSIZ), t.writeUInt32LE(Math.min(d, e.EF_ZIP64_OR_32), a + e.ENDOFF), t.writeUInt16LE(f, a + e.ENDCOM), t.fill(" ", a + e.ENDHDR), t;
      },
      toJSON: function() {
        const t = function(a, D) {
          let y = a.toString(16).toUpperCase();
          for (; y.length < D; ) y = "0" + y;
          return "0x" + y;
        };
        return {
          diskEntries: n,
          totalEntries: i,
          size: c + " bytes",
          offset: t(d, 4),
          commentLength: f
        };
      },
      toString: function() {
        return JSON.stringify(this.toJSON(), null, "	");
      }
    };
  }, oe;
}
var we;
function be() {
  return we || (we = 1, k.EntryHeader = Xe(), k.MainHeader = Ke()), k;
}
var X = {}, ae, _e;
function ke() {
  return _e || (_e = 1, ae = function(u) {
    var e = Me, n = { chunkSize: (parseInt(u.length / 1024) + 1) * 1024 };
    return {
      deflate: function() {
        return e.deflateRawSync(u, n);
      },
      deflateAsync: function(i) {
        var c = e.createDeflateRaw(n), d = [], f = 0;
        c.on("data", function(E) {
          d.push(E), f += E.length;
        }), c.on("end", function() {
          var E = Buffer.alloc(f), t = 0;
          E.fill(0);
          for (var a = 0; a < d.length; a++) {
            var D = d[a];
            D.copy(E, t), t += D.length;
          }
          i && i(E);
        }), c.end(u);
      }
    };
  }), ae;
}
var ce, Ne;
function Ye() {
  var e;
  if (Ne) return ce;
  Ne = 1;
  const u = +(((e = process == null ? void 0 : process.versions) == null ? void 0 : e.node) ?? "").split(".")[0] || 0;
  return ce = function(n, i) {
    var c = Me;
    const d = u >= 15 && i > 0 ? { maxOutputLength: i } : {};
    return {
      inflate: function() {
        return c.inflateRawSync(n, d);
      },
      inflateAsync: function(f) {
        var E = c.createInflateRaw(d), t = [], a = 0;
        E.on("data", function(D) {
          t.push(D), a += D.length;
        }), E.on("end", function() {
          var D = Buffer.alloc(a), y = 0;
          D.fill(0);
          for (var S = 0; S < t.length; S++) {
            var h = t[S];
            h.copy(D, y), y += h.length;
          }
          f && f(D);
        }), E.end(n);
      }
    };
  }, ce;
}
var fe, Fe;
function Qe() {
  if (Fe) return fe;
  Fe = 1;
  const { randomFillSync: u } = Re, e = he(), n = new Uint32Array(256).map((h, p) => {
    for (let I = 0; I < 8; I++)
      (p & 1) !== 0 ? p = p >>> 1 ^ 3988292384 : p >>>= 1;
    return p >>> 0;
  }), i = (h, p) => Math.imul(h, p) >>> 0, c = (h, p) => n[(h ^ p) & 255] ^ h >>> 8, d = () => typeof u == "function" ? u(Buffer.alloc(12)) : d.node();
  d.node = () => {
    const h = Buffer.alloc(12), p = h.length;
    for (let I = 0; I < p; I++) h[I] = Math.random() * 256 & 255;
    return h;
  };
  const f = {
    genSalt: d
  };
  function E(h) {
    const p = Buffer.isBuffer(h) ? h : Buffer.from(h);
    this.keys = new Uint32Array([305419896, 591751049, 878082192]);
    for (let I = 0; I < p.length; I++)
      this.updateKeys(p[I]);
  }
  E.prototype.updateKeys = function(h) {
    const p = this.keys;
    return p[0] = c(p[0], h), p[1] += p[0] & 255, p[1] = i(p[1], 134775813) + 1, p[2] = c(p[2], p[1] >>> 24), h;
  }, E.prototype.next = function() {
    const h = (this.keys[2] | 2) >>> 0;
    return i(h, h ^ 1) >> 8 & 255;
  };
  function t(h) {
    const p = new E(h);
    return function(I) {
      const C = Buffer.alloc(I.length);
      let w = 0;
      for (let L of I)
        C[w++] = p.updateKeys(L ^ p.next());
      return C;
    };
  }
  function a(h) {
    const p = new E(h);
    return function(I, C, w = 0) {
      C || (C = Buffer.alloc(I.length));
      for (let L of I) {
        const _ = p.next();
        C[w++] = L ^ _, p.updateKeys(L);
      }
      return C;
    };
  }
  function D(h, p, I) {
    if (!h || !Buffer.isBuffer(h) || h.length < 12)
      return Buffer.alloc(0);
    const C = t(I), w = C(h.slice(0, 12)), L = (p.flags & 8) === 8 ? p.timeHighByte : p.crc >>> 24;
    if (w[11] !== L)
      throw e.WRONG_PASSWORD();
    return C(h.slice(12));
  }
  function y(h) {
    Buffer.isBuffer(h) && h.length >= 12 ? f.genSalt = function() {
      return h.slice(0, 12);
    } : h === "node" ? f.genSalt = d.node : f.genSalt = d;
  }
  function S(h, p, I, C = !1) {
    h == null && (h = Buffer.alloc(0)), Buffer.isBuffer(h) || (h = Buffer.from(h.toString()));
    const w = a(I), L = f.genSalt();
    L[11] = p.crc >>> 24 & 255, C && (L[10] = p.crc >>> 16 & 255);
    const _ = Buffer.alloc(h.length + 12);
    return w(L, _), w(h, _, 12);
  }
  return fe = { decrypt: D, encrypt: S, _salter: y }, fe;
}
var Pe;
function et() {
  return Pe || (Pe = 1, X.Deflater = ke(), X.Inflater = Ye(), X.ZipCrypto = Qe()), X;
}
var le, Oe;
function Be() {
  if (Oe) return le;
  Oe = 1;
  var u = K(), e = be(), n = u.Constants, i = et();
  return le = function(c, d) {
    var f = new e.EntryHeader(), E = Buffer.alloc(0), t = Buffer.alloc(0), a = !1, D = null, y = Buffer.alloc(0), S = Buffer.alloc(0), h = !0;
    const p = c, I = typeof p.decoder == "object" ? p.decoder : u.decoder;
    h = I.hasOwnProperty("efs") ? I.efs : !1;
    function C() {
      return !d || !(d instanceof Uint8Array) ? Buffer.alloc(0) : (S = f.loadLocalHeaderFromBinary(d), d.slice(f.realDataOffset, f.realDataOffset + f.compressedSize));
    }
    function w(o) {
      if (!f.flags_desc && !f.localHeader.flags_desc) {
        if (u.crc32(o) !== f.localHeader.crc)
          return !1;
      } else {
        const l = {}, g = f.realDataOffset + f.compressedSize;
        if (d.readUInt32LE(g) == n.LOCSIG || d.readUInt32LE(g) == n.CENSIG)
          throw u.Errors.DESCRIPTOR_NOT_EXIST();
        if (d.readUInt32LE(g) == n.EXTSIG)
          l.crc = d.readUInt32LE(g + n.EXTCRC), l.compressedSize = d.readUInt32LE(g + n.EXTSIZ), l.size = d.readUInt32LE(g + n.EXTLEN);
        else if (d.readUInt16LE(g + 12) === 19280)
          l.crc = d.readUInt32LE(g + n.EXTCRC - 4), l.compressedSize = d.readUInt32LE(g + n.EXTSIZ - 4), l.size = d.readUInt32LE(g + n.EXTLEN - 4);
        else
          throw u.Errors.DESCRIPTOR_UNKNOWN();
        if (l.compressedSize !== f.compressedSize || l.size !== f.size || l.crc !== f.crc)
          throw u.Errors.DESCRIPTOR_FAULTY();
        if (u.crc32(o) !== l.crc)
          return !1;
      }
      return !0;
    }
    function L(o, l, g) {
      if (typeof l > "u" && typeof o == "string" && (g = o, o = void 0), a)
        return o && l && l(Buffer.alloc(0), u.Errors.DIRECTORY_CONTENT_ERROR()), Buffer.alloc(0);
      var F = C();
      if (F.length === 0)
        return o && l && l(F), F;
      if (f.encrypted) {
        if (typeof g != "string" && !Buffer.isBuffer(g))
          throw u.Errors.INVALID_PASS_PARAM();
        F = i.ZipCrypto.decrypt(F, f, g);
      }
      var O = Buffer.alloc(f.size);
      switch (f.method) {
        case u.Constants.STORED:
          if (F.copy(O), w(O))
            return o && l && l(O), O;
          throw o && l && l(O, u.Errors.BAD_CRC()), u.Errors.BAD_CRC();
        case u.Constants.DEFLATED:
          var x = new i.Inflater(F, f.size);
          if (o)
            x.inflateAsync(function(P) {
              P.copy(P, 0), l && (w(P) ? l(P) : l(P, u.Errors.BAD_CRC()));
            });
          else {
            if (x.inflate(O).copy(O, 0), !w(O))
              throw u.Errors.BAD_CRC(`"${I.decode(E)}"`);
            return O;
          }
          break;
        default:
          throw o && l && l(Buffer.alloc(0), u.Errors.UNKNOWN_METHOD()), u.Errors.UNKNOWN_METHOD();
      }
    }
    function _(o, l) {
      if ((!D || !D.length) && Buffer.isBuffer(d))
        return o && l && l(C()), C();
      if (D.length && !a) {
        var g;
        switch (f.method) {
          case u.Constants.STORED:
            return f.compressedSize = f.size, g = Buffer.alloc(D.length), D.copy(g), o && l && l(g), g;
          default:
          case u.Constants.DEFLATED:
            var F = new i.Deflater(D);
            if (o)
              F.deflateAsync(function(x) {
                g = Buffer.alloc(x.length), f.compressedSize = x.length, x.copy(g), l && l(g);
              });
            else {
              var O = F.deflate();
              return f.compressedSize = O.length, O;
            }
            F = null;
            break;
        }
      } else if (o && l)
        l(Buffer.alloc(0));
      else
        return Buffer.alloc(0);
    }
    function s(o, l) {
      return u.readBigUInt64LE(o, l);
    }
    function r(o) {
      try {
        for (var l = 0, g, F, O; l + 4 < o.length; )
          g = o.readUInt16LE(l), l += 2, F = o.readUInt16LE(l), l += 2, O = o.slice(l, l + F), l += F, n.ID_ZIP64 === g && m(O);
      } catch {
        throw u.Errors.EXTRA_FIELD_PARSE_ERROR();
      }
    }
    function m(o) {
      var l, g, F, O;
      o.length >= n.EF_ZIP64_SCOMP && (l = s(o, n.EF_ZIP64_SUNCOMP), f.size === n.EF_ZIP64_OR_32 && (f.size = l)), o.length >= n.EF_ZIP64_RHO && (g = s(o, n.EF_ZIP64_SCOMP), f.compressedSize === n.EF_ZIP64_OR_32 && (f.compressedSize = g)), o.length >= n.EF_ZIP64_DSN && (F = s(o, n.EF_ZIP64_RHO), f.offset === n.EF_ZIP64_OR_32 && (f.offset = F)), o.length >= n.EF_ZIP64_DSN + 4 && (O = o.readUInt32LE(n.EF_ZIP64_DSN), f.diskNumStart === n.EF_ZIP64_OR_16 && (f.diskNumStart = O));
    }
    return {
      get entryName() {
        return I.decode(E);
      },
      get rawEntryName() {
        return E;
      },
      set entryName(o) {
        E = u.toBuffer(o, I.encode);
        var l = E[E.length - 1];
        a = l === 47 || l === 92, f.fileNameLength = E.length;
      },
      get efs() {
        return typeof h == "function" ? h(this.entryName) : h;
      },
      get extra() {
        return y;
      },
      set extra(o) {
        y = o, f.extraLength = o.length, r(o);
      },
      get comment() {
        return I.decode(t);
      },
      set comment(o) {
        if (t = u.toBuffer(o, I.encode), f.commentLength = t.length, t.length > 65535) throw u.Errors.COMMENT_TOO_LONG();
      },
      get name() {
        var o = I.decode(E);
        return a ? o.substr(o.length - 1).split("/").pop() : o.split("/").pop();
      },
      get isDirectory() {
        return a;
      },
      getCompressedData: function() {
        return _(!1, null);
      },
      getCompressedDataAsync: function(o) {
        _(!0, o);
      },
      setData: function(o) {
        D = u.toBuffer(o, u.decoder.encode), !a && D.length ? (f.size = D.length, f.method = u.Constants.DEFLATED, f.crc = u.crc32(o), f.changed = !0) : f.method = u.Constants.STORED;
      },
      getData: function(o) {
        return f.changed ? D : L(!1, null, o);
      },
      getDataAsync: function(o, l) {
        f.changed ? o(D) : L(!0, o, l);
      },
      set attr(o) {
        f.attr = o;
      },
      get attr() {
        return f.attr;
      },
      set header(o) {
        f.loadFromBinary(o);
      },
      get header() {
        return f;
      },
      packCentralHeader: function() {
        f.flags_efs = this.efs, f.extraLength = y.length;
        var o = f.centralHeaderToBinary(), l = u.Constants.CENHDR;
        return E.copy(o, l), l += E.length, y.copy(o, l), l += f.extraLength, t.copy(o, l), o;
      },
      packLocalHeader: function() {
        let o = 0;
        f.flags_efs = this.efs, f.extraLocalLength = S.length;
        const l = f.localHeaderToBinary(), g = Buffer.alloc(l.length + E.length + f.extraLocalLength);
        return l.copy(g, o), o += l.length, E.copy(g, o), o += E.length, S.copy(g, o), o += S.length, g;
      },
      toJSON: function() {
        const o = function(l) {
          return "<" + (l && l.length + " bytes buffer" || "null") + ">";
        };
        return {
          entryName: this.entryName,
          name: this.name,
          comment: this.comment,
          isDirectory: this.isDirectory,
          header: f.toJSON(),
          compressedData: o(d),
          data: o(D)
        };
      },
      toString: function() {
        return JSON.stringify(this.toJSON(), null, "	");
      }
    };
  }, le;
}
var ue, ve;
function tt() {
  if (ve) return ue;
  ve = 1;
  const u = Be(), e = be(), n = K();
  return ue = function(i, c) {
    var d = [], f = {}, E = Buffer.alloc(0), t = new e.MainHeader(), a = !1;
    const D = /* @__PURE__ */ new Set(), y = c, { noSort: S, decoder: h } = y;
    i ? C(y.readEntries) : a = !0;
    function p() {
      const L = /* @__PURE__ */ new Set();
      for (const _ of Object.keys(f)) {
        const s = _.split("/");
        if (s.pop(), !!s.length)
          for (let r = 0; r < s.length; r++) {
            const m = s.slice(0, r + 1).join("/") + "/";
            L.add(m);
          }
      }
      for (const _ of L)
        if (!(_ in f)) {
          const s = new u(y);
          s.entryName = _, s.attr = 16, s.temporary = !0, d.push(s), f[s.entryName] = s, D.add(s);
        }
    }
    function I() {
      if (a = !0, f = {}, t.diskEntries > (i.length - t.offset) / n.Constants.CENHDR)
        throw n.Errors.DISK_ENTRY_TOO_LARGE();
      d = new Array(t.diskEntries);
      for (var L = t.offset, _ = 0; _ < d.length; _++) {
        var s = L, r = new u(y, i);
        r.header = i.slice(s, s += n.Constants.CENHDR), r.entryName = i.slice(s, s += r.header.fileNameLength), r.header.extraLength && (r.extra = i.slice(s, s += r.header.extraLength)), r.header.commentLength && (r.comment = i.slice(s, s + r.header.commentLength)), L += r.header.centralHeaderSize, d[_] = r, f[r.entryName] = r;
      }
      D.clear(), p();
    }
    function C(L) {
      var _ = i.length - n.Constants.ENDHDR, s = Math.max(0, _ - 65535), r = s, m = i.length, o = -1, l = 0;
      for ((typeof y.trailingSpace == "boolean" ? y.trailingSpace : !1) && (s = 0), _; _ >= r; _--)
        if (i[_] === 80) {
          if (i.readUInt32LE(_) === n.Constants.ENDSIG) {
            o = _, l = _, m = _ + n.Constants.ENDHDR, r = _ - n.Constants.END64HDR;
            continue;
          }
          if (i.readUInt32LE(_) === n.Constants.END64SIG) {
            r = s;
            continue;
          }
          if (i.readUInt32LE(_) === n.Constants.ZIP64SIG) {
            o = _, m = _ + n.readBigUInt64LE(i, _ + n.Constants.ZIP64SIZE) + n.Constants.ZIP64LEAD;
            break;
          }
        }
      if (o == -1) throw n.Errors.INVALID_FORMAT();
      t.loadFromBinary(i.slice(o, m)), t.commentLength && (E = i.slice(l + n.Constants.ENDHDR)), L && I();
    }
    function w() {
      d.length > 1 && !S && d.sort((L, _) => L.entryName.toLowerCase().localeCompare(_.entryName.toLowerCase()));
    }
    return {
      /**
       * Returns an array of ZipEntry objects existent in the current opened archive
       * @return Array
       */
      get entries() {
        return a || I(), d.filter((L) => !D.has(L));
      },
      /**
       * Archive comment
       * @return {String}
       */
      get comment() {
        return h.decode(E);
      },
      set comment(L) {
        E = n.toBuffer(L, h.encode), t.commentLength = E.length;
      },
      getEntryCount: function() {
        return a ? d.length : t.diskEntries;
      },
      forEach: function(L) {
        this.entries.forEach(L);
      },
      /**
       * Returns a reference to the entry with the given name or null if entry is inexistent
       *
       * @param entryName
       * @return ZipEntry
       */
      getEntry: function(L) {
        return a || I(), f[L] || null;
      },
      /**
       * Adds the given entry to the entry list
       *
       * @param entry
       */
      setEntry: function(L) {
        a || I(), d.push(L), f[L.entryName] = L, t.totalEntries = d.length;
      },
      /**
       * Removes the file with the given name from the entry list.
       *
       * If the entry is a directory, then all nested files and directories will be removed
       * @param entryName
       * @returns {void}
       */
      deleteFile: function(L, _ = !0) {
        a || I();
        const s = f[L];
        this.getEntryChildren(s, _).map((m) => m.entryName).forEach(this.deleteEntry);
      },
      /**
       * Removes the entry with the given name from the entry list.
       *
       * @param {string} entryName
       * @returns {void}
       */
      deleteEntry: function(L) {
        a || I();
        const _ = f[L], s = d.indexOf(_);
        s >= 0 && (d.splice(s, 1), delete f[L], t.totalEntries = d.length);
      },
      /**
       *  Iterates and returns all nested files and directories of the given entry
       *
       * @param entry
       * @return Array
       */
      getEntryChildren: function(L, _ = !0) {
        if (a || I(), typeof L == "object")
          if (L.isDirectory && _) {
            const s = [], r = L.entryName;
            for (const m of d)
              m.entryName.startsWith(r) && s.push(m);
            return s;
          } else
            return [L];
        return [];
      },
      /**
       *  How many child elements entry has
       *
       * @param {ZipEntry} entry
       * @return {integer}
       */
      getChildCount: function(L) {
        if (L && L.isDirectory) {
          const _ = this.getEntryChildren(L);
          return _.includes(L) ? _.length - 1 : _.length;
        }
        return 0;
      },
      /**
       * Returns the zip file
       *
       * @return Buffer
       */
      compressToBuffer: function() {
        a || I(), w();
        const L = [], _ = [];
        let s = 0, r = 0;
        t.size = 0, t.offset = 0;
        let m = 0;
        for (const g of this.entries) {
          const F = g.getCompressedData();
          g.header.offset = r;
          const O = g.packLocalHeader(), x = O.length + F.length;
          r += x, L.push(O), L.push(F);
          const P = g.packCentralHeader();
          _.push(P), t.size += P.length, s += x + P.length, m++;
        }
        s += t.mainHeaderSize, t.offset = r, t.totalEntries = m, r = 0;
        const o = Buffer.alloc(s);
        for (const g of L)
          g.copy(o, r), r += g.length;
        for (const g of _)
          g.copy(o, r), r += g.length;
        const l = t.toBinary();
        return E && E.copy(l, l.length - E.length), l.copy(o, r), i = o, a = !1, o;
      },
      toAsyncBuffer: function(L, _, s, r) {
        try {
          a || I(), w();
          const m = [], o = [];
          let l = 0, g = 0, F = 0;
          t.size = 0, t.offset = 0;
          const O = function(x) {
            if (x.length > 0) {
              const P = x.shift(), v = P.entryName + P.extra.toString();
              s && s(v), P.getCompressedDataAsync(function(A) {
                r && r(v), P.header.offset = g;
                const B = P.packLocalHeader(), U = B.length + A.length;
                g += U, m.push(B), m.push(A);
                const Z = P.packCentralHeader();
                o.push(Z), t.size += Z.length, l += U + Z.length, F++, O(x);
              });
            } else {
              l += t.mainHeaderSize, t.offset = g, t.totalEntries = F, g = 0;
              const P = Buffer.alloc(l);
              m.forEach(function(A) {
                A.copy(P, g), g += A.length;
              }), o.forEach(function(A) {
                A.copy(P, g), g += A.length;
              });
              const v = t.toBinary();
              E && E.copy(v, v.length - E.length), v.copy(P, g), i = P, a = !1, L(P);
            }
          };
          O(Array.from(this.entries));
        } catch (m) {
          _(m);
        }
      }
    };
  }, ue;
}
var de, xe;
function nt() {
  if (xe) return de;
  xe = 1;
  const u = K(), e = T, n = Be(), i = tt(), c = (...t) => u.findLast(t, (a) => typeof a == "boolean"), d = (...t) => u.findLast(t, (a) => typeof a == "string"), f = (...t) => u.findLast(t, (a) => typeof a == "function"), E = {
    // option "noSort" : if true it disables files sorting
    noSort: !1,
    // read entries during load (initial loading may be slower)
    readEntries: !1,
    // default method is none
    method: u.Constants.NONE,
    // file system
    fs: null
  };
  return de = function(t, a) {
    let D = null;
    const y = Object.assign(/* @__PURE__ */ Object.create(null), E);
    t && typeof t == "object" && (t instanceof Uint8Array || (Object.assign(y, t), t = y.input ? y.input : void 0, y.input && delete y.input), Buffer.isBuffer(t) && (D = t, y.method = u.Constants.BUFFER, t = void 0)), Object.assign(y, a);
    const S = new u(y);
    if ((typeof y.decoder != "object" || typeof y.decoder.encode != "function" || typeof y.decoder.decode != "function") && (y.decoder = u.decoder), t && typeof t == "string")
      if (S.fs.existsSync(t))
        y.method = u.Constants.FILE, y.filename = t, D = S.fs.readFileSync(t);
      else
        throw u.Errors.INVALID_FILENAME();
    const h = new i(D, y), { canonical: p, sanitize: I, zipnamefix: C } = u;
    function w(r) {
      if (r && h) {
        var m;
        if (typeof r == "string" && (m = h.getEntry(e.posix.normalize(r))), typeof r == "object" && typeof r.entryName < "u" && typeof r.header < "u" && (m = h.getEntry(r.entryName)), m)
          return m;
      }
      return null;
    }
    function L(r) {
      const { join: m, normalize: o, sep: l } = e.posix;
      return m(e.isAbsolute(r) ? "/" : ".", o(l + r.split("\\").join(l) + l));
    }
    function _(r) {
      return r instanceof RegExp ? /* @__PURE__ */ (function(m) {
        return function(o) {
          return m.test(o);
        };
      })(r) : typeof r != "function" ? () => !0 : r;
    }
    const s = (r, m) => {
      let o = m.slice(-1);
      return o = o === S.sep ? S.sep : "", e.relative(r, m) + o;
    };
    return {
      /**
       * Extracts the given entry from the archive and returns the content as a Buffer object
       * @param {ZipEntry|string} entry ZipEntry object or String with the full path of the entry
       * @param {Buffer|string} [pass] - password
       * @return Buffer or Null in case of error
       */
      readFile: function(r, m) {
        var o = w(r);
        return o && o.getData(m) || null;
      },
      /**
       * Returns how many child elements has on entry (directories) on files it is always 0
       * @param {ZipEntry|string} entry ZipEntry object or String with the full path of the entry
       * @returns {integer}
       */
      childCount: function(r) {
        const m = w(r);
        if (m)
          return h.getChildCount(m);
      },
      /**
       * Asynchronous readFile
       * @param {ZipEntry|string} entry ZipEntry object or String with the full path of the entry
       * @param {callback} callback
       *
       * @return Buffer or Null in case of error
       */
      readFileAsync: function(r, m) {
        var o = w(r);
        o ? o.getDataAsync(m) : m(null, "getEntry failed for:" + r);
      },
      /**
       * Extracts the given entry from the archive and returns the content as plain text in the given encoding
       * @param {ZipEntry|string} entry - ZipEntry object or String with the full path of the entry
       * @param {string} encoding - Optional. If no encoding is specified utf8 is used
       *
       * @return String
       */
      readAsText: function(r, m) {
        var o = w(r);
        if (o) {
          var l = o.getData();
          if (l && l.length)
            return l.toString(m || "utf8");
        }
        return "";
      },
      /**
       * Asynchronous readAsText
       * @param {ZipEntry|string} entry ZipEntry object or String with the full path of the entry
       * @param {callback} callback
       * @param {string} [encoding] - Optional. If no encoding is specified utf8 is used
       *
       * @return String
       */
      readAsTextAsync: function(r, m, o) {
        var l = w(r);
        l ? l.getDataAsync(function(g, F) {
          if (F) {
            m(g, F);
            return;
          }
          g && g.length ? m(g.toString(o || "utf8")) : m("");
        }) : m("");
      },
      /**
       * Remove the entry from the file or the entry and all it's nested directories and files if the given entry is a directory
       *
       * @param {ZipEntry|string} entry
       * @param {boolean} withsubfolders
       * @returns {void}
       */
      deleteFile: function(r, m = !0) {
        var o = w(r);
        o && h.deleteFile(o.entryName, m);
      },
      /**
       * Remove the entry from the file or directory without affecting any nested entries
       *
       * @param {ZipEntry|string} entry
       * @returns {void}
       */
      deleteEntry: function(r) {
        var m = w(r);
        m && h.deleteEntry(m.entryName);
      },
      /**
       * Adds a comment to the zip. The zip must be rewritten after adding the comment.
       *
       * @param {string} comment
       */
      addZipComment: function(r) {
        h.comment = r;
      },
      /**
       * Returns the zip comment
       *
       * @return String
       */
      getZipComment: function() {
        return h.comment || "";
      },
      /**
       * Adds a comment to a specified zipEntry. The zip must be rewritten after adding the comment
       * The comment cannot exceed 65535 characters in length
       *
       * @param {ZipEntry} entry
       * @param {string} comment
       */
      addZipEntryComment: function(r, m) {
        var o = w(r);
        o && (o.comment = m);
      },
      /**
       * Returns the comment of the specified entry
       *
       * @param {ZipEntry} entry
       * @return String
       */
      getZipEntryComment: function(r) {
        var m = w(r);
        return m && m.comment || "";
      },
      /**
       * Updates the content of an existing entry inside the archive. The zip must be rewritten after updating the content
       *
       * @param {ZipEntry} entry
       * @param {Buffer} content
       */
      updateFile: function(r, m) {
        var o = w(r);
        o && o.setData(m);
      },
      /**
       * Adds a file from the disk to the archive
       *
       * @param {string} localPath File to add to zip
       * @param {string} [zipPath] Optional path inside the zip
       * @param {string} [zipName] Optional name for the file
       * @param {string} [comment] Optional file comment
       */
      addLocalFile: function(r, m, o, l) {
        if (S.fs.existsSync(r)) {
          m = m ? L(m) : "";
          const g = e.win32.basename(e.win32.normalize(r));
          m += o || g;
          const F = S.fs.statSync(r), O = F.isFile() ? S.fs.readFileSync(r) : Buffer.alloc(0);
          F.isDirectory() && (m += S.sep), this.addFile(m, O, l, F);
        } else
          throw u.Errors.FILE_NOT_FOUND(r);
      },
      /**
       * Callback for showing if everything was done.
       *
       * @callback doneCallback
       * @param {Error} err - Error object
       * @param {boolean} done - was request fully completed
       */
      /**
       * Adds a file from the disk to the archive
       *
       * @param {(object|string)} options - options object, if it is string it us used as localPath.
       * @param {string} options.localPath - Local path to the file.
       * @param {string} [options.comment] - Optional file comment.
       * @param {string} [options.zipPath] - Optional path inside the zip
       * @param {string} [options.zipName] - Optional name for the file
       * @param {doneCallback} callback - The callback that handles the response.
       */
      addLocalFileAsync: function(r, m) {
        r = typeof r == "object" ? r : { localPath: r };
        const o = e.resolve(r.localPath), { comment: l } = r;
        let { zipPath: g, zipName: F } = r;
        const O = this;
        S.fs.stat(o, function(x, P) {
          if (x) return m(x, !1);
          g = g ? L(g) : "";
          const v = e.win32.basename(e.win32.normalize(o));
          if (g += F || v, P.isFile())
            S.fs.readFile(o, function(A, B) {
              return A ? m(A, !1) : (O.addFile(g, B, l, P), setImmediate(m, void 0, !0));
            });
          else if (P.isDirectory())
            return g += S.sep, O.addFile(g, Buffer.alloc(0), l, P), setImmediate(m, void 0, !0);
        });
      },
      /**
       * Adds a local directory and all its nested files and directories to the archive
       *
       * @param {string} localPath - local path to the folder
       * @param {string} [zipPath] - optional path inside zip
       * @param {(RegExp|function)} [filter] - optional RegExp or Function if files match will be included.
       */
      addLocalFolder: function(r, m, o) {
        if (o = _(o), m = m ? L(m) : "", r = e.normalize(r), S.fs.existsSync(r)) {
          const l = S.findFiles(r), g = this;
          if (l.length)
            for (const F of l) {
              const O = e.join(m, s(r, F));
              o(O) && g.addLocalFile(F, e.dirname(O));
            }
        } else
          throw u.Errors.FILE_NOT_FOUND(r);
      },
      /**
       * Asynchronous addLocalFolder
       * @param {string} localPath
       * @param {callback} callback
       * @param {string} [zipPath] optional path inside zip
       * @param {RegExp|function} [filter] optional RegExp or Function if files match will
       *               be included.
       */
      addLocalFolderAsync: function(r, m, o, l) {
        l = _(l), o = o ? L(o) : "", r = e.normalize(r);
        var g = this;
        S.fs.open(r, "r", function(F) {
          if (F && F.code === "ENOENT")
            m(void 0, u.Errors.FILE_NOT_FOUND(r));
          else if (F)
            m(void 0, F);
          else {
            var O = S.findFiles(r), x = -1, P = function() {
              if (x += 1, x < O.length) {
                var v = O[x], A = s(r, v).split("\\").join("/");
                A = A.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\x20-\x7E]/g, ""), l(A) ? S.fs.stat(v, function(B, U) {
                  B && m(void 0, B), U.isFile() ? S.fs.readFile(v, function(Z, $) {
                    Z ? m(void 0, Z) : (g.addFile(o + A, $, "", U), P());
                  }) : (g.addFile(o + A + "/", Buffer.alloc(0), "", U), P());
                }) : process.nextTick(() => {
                  P();
                });
              } else
                m(!0, void 0);
            };
            P();
          }
        });
      },
      /**
       * Adds a local directory and all its nested files and directories to the archive
       *
       * @param {object | string} options - options object, if it is string it us used as localPath.
       * @param {string} options.localPath - Local path to the folder.
       * @param {string} [options.zipPath] - optional path inside zip.
       * @param {RegExp|function} [options.filter] - optional RegExp or Function if files match will be included.
       * @param {function|string} [options.namefix] - optional function to help fix filename
       * @param {doneCallback} callback - The callback that handles the response.
       *
       */
      addLocalFolderAsync2: function(r, m) {
        const o = this;
        r = typeof r == "object" ? r : { localPath: r };
        const l = e.resolve(L(r.localPath));
        let { zipPath: g, filter: F, namefix: O } = r;
        F instanceof RegExp ? F = /* @__PURE__ */ (function(v) {
          return function(A) {
            return v.test(A);
          };
        })(F) : typeof F != "function" && (F = function() {
          return !0;
        }), g = g ? L(g) : "", O === "latin1" && (O = (v) => v.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\x20-\x7E]/g, "")), typeof O != "function" && (O = (v) => v);
        const x = (v) => e.join(g, O(s(l, v))), P = (v) => e.win32.basename(e.win32.normalize(O(v)));
        S.fs.open(l, "r", function(v) {
          v && v.code === "ENOENT" ? m(void 0, u.Errors.FILE_NOT_FOUND(l)) : v ? m(void 0, v) : S.findFilesAsync(l, function(A, B) {
            if (A) return m(A);
            B = B.filter((U) => F(x(U))), B.length || m(void 0, !1), setImmediate(
              B.reverse().reduce(function(U, Z) {
                return function($, J) {
                  if ($ || J === !1) return setImmediate(U, $, !1);
                  o.addLocalFileAsync(
                    {
                      localPath: Z,
                      zipPath: e.dirname(x(Z)),
                      zipName: P(Z)
                    },
                    U
                  );
                };
              }, m)
            );
          });
        });
      },
      /**
       * Adds a local directory and all its nested files and directories to the archive
       *
       * @param {string} localPath - path where files will be extracted
       * @param {object} props - optional properties
       * @param {string} [props.zipPath] - optional path inside zip
       * @param {RegExp|function} [props.filter] - optional RegExp or Function if files match will be included.
       * @param {function|string} [props.namefix] - optional function to help fix filename
       */
      addLocalFolderPromise: function(r, m) {
        return new Promise((o, l) => {
          this.addLocalFolderAsync2(Object.assign({ localPath: r }, m), (g, F) => {
            g && l(g), F && o(this);
          });
        });
      },
      /**
       * Allows you to create a entry (file or directory) in the zip file.
       * If you want to create a directory the entryName must end in / and a null buffer should be provided.
       * Comment and attributes are optional
       *
       * @param {string} entryName
       * @param {Buffer | string} content - file content as buffer or utf8 coded string
       * @param {string} [comment] - file comment
       * @param {number | object} [attr] - number as unix file permissions, object as filesystem Stats object
       */
      addFile: function(r, m, o, l) {
        r = C(r);
        let g = w(r);
        const F = g != null;
        F || (g = new n(y), g.entryName = r), g.comment = o || "";
        const O = typeof l == "object" && l instanceof S.fs.Stats;
        O && (g.header.time = l.mtime);
        var x = g.isDirectory ? 16 : 0;
        let P = g.isDirectory ? 16384 : 32768;
        return O ? P |= 4095 & l.mode : typeof l == "number" ? P |= 4095 & l : P |= g.isDirectory ? 493 : 420, x = (x | P << 16) >>> 0, g.attr = x, g.setData(m), F || h.setEntry(g), g;
      },
      /**
       * Returns an array of ZipEntry objects representing the files and folders inside the archive
       *
       * @param {string} [password]
       * @returns Array
       */
      getEntries: function(r) {
        return h.password = r, h ? h.entries : [];
      },
      /**
       * Returns a ZipEntry object representing the file or folder specified by ``name``.
       *
       * @param {string} name
       * @return ZipEntry
       */
      getEntry: function(r) {
        return w(r);
      },
      getEntryCount: function() {
        return h.getEntryCount();
      },
      forEach: function(r) {
        return h.forEach(r);
      },
      /**
       * Extracts the given entry to the given targetPath
       * If the entry is a directory inside the archive, the entire directory and it's subdirectories will be extracted
       *
       * @param {string|ZipEntry} entry - ZipEntry object or String with the full path of the entry
       * @param {string} targetPath - Target folder where to write the file
       * @param {boolean} [maintainEntryPath=true] - If maintainEntryPath is true and the entry is inside a folder, the entry folder will be created in targetPath as well. Default is TRUE
       * @param {boolean} [overwrite=false] - If the file already exists at the target path, the file will be overwriten if this is true.
       * @param {boolean} [keepOriginalPermission=false] - The file will be set as the permission from the entry if this is true.
       * @param {string} [outFileName] - String If set will override the filename of the extracted file (Only works if the entry is a file)
       *
       * @return Boolean
       */
      extractEntryTo: function(r, m, o, l, g, F) {
        l = c(!1, l), g = c(!1, g), o = c(!0, o), F = d(g, F);
        var O = w(r);
        if (!O)
          throw u.Errors.NO_ENTRY();
        var x = p(O.entryName), P = I(m, F && !O.isDirectory ? p(F) : o ? x : e.basename(x));
        if (O.isDirectory) {
          var v = h.getEntryChildren(O);
          return v.forEach(function(U) {
            if (U.isDirectory) return;
            var Z = U.getData();
            if (!Z)
              throw u.Errors.CANT_EXTRACT_FILE();
            var $ = p(U.entryName), J = I(m, o ? $ : e.basename($));
            const Q = g ? U.header.fileAttr : void 0;
            S.writeFileTo(J, Z, l, Q);
          }), !0;
        }
        var A = O.getData(h.password);
        if (!A) throw u.Errors.CANT_EXTRACT_FILE();
        if (S.fs.existsSync(P) && !l)
          throw u.Errors.CANT_OVERRIDE();
        const B = g ? r.header.fileAttr : void 0;
        return S.writeFileTo(P, A, l, B), !0;
      },
      /**
       * Test the archive
       * @param {string} [pass]
       */
      test: function(r) {
        if (!h)
          return !1;
        for (var m of h.entries)
          try {
            if (m.isDirectory)
              continue;
            var o = h.entries[m].getData(r);
            if (!o)
              return !1;
          } catch {
            return !1;
          }
        return !0;
      },
      /**
       * Extracts the entire archive to the given location
       *
       * @param {string} targetPath Target location
       * @param {boolean} [overwrite=false] If the file already exists at the target path, the file will be overwriten if this is true.
       *                  Default is FALSE
       * @param {boolean} [keepOriginalPermission=false] The file will be set as the permission from the entry if this is true.
       *                  Default is FALSE
       * @param {string|Buffer} [pass] password
       */
      extractAllTo: function(r, m, o, l) {
        if (o = c(!1, o), l = d(o, l), m = c(!1, m), !h) throw u.Errors.NO_ZIP();
        h.entries.forEach(function(g) {
          var F = I(r, p(g.entryName));
          if (g.isDirectory) {
            S.makeDir(F);
            return;
          }
          var O = g.getData(l);
          if (!O)
            throw u.Errors.CANT_EXTRACT_FILE();
          const x = o ? g.header.fileAttr : void 0;
          S.writeFileTo(F, O, m, x);
          try {
            S.fs.utimesSync(F, g.header.time, g.header.time);
          } catch {
            throw u.Errors.CANT_EXTRACT_FILE();
          }
        });
      },
      /**
       * Asynchronous extractAllTo
       *
       * @param {string} targetPath Target location
       * @param {boolean} [overwrite=false] If the file already exists at the target path, the file will be overwriten if this is true.
       *                  Default is FALSE
       * @param {boolean} [keepOriginalPermission=false] The file will be set as the permission from the entry if this is true.
       *                  Default is FALSE
       * @param {function} callback The callback will be executed when all entries are extracted successfully or any error is thrown.
       */
      extractAllToAsync: function(r, m, o, l) {
        if (l = f(m, o, l), o = c(!1, o), m = c(!1, m), !l)
          return new Promise((P, v) => {
            this.extractAllToAsync(r, m, o, function(A) {
              A ? v(A) : P(this);
            });
          });
        if (!h) {
          l(u.Errors.NO_ZIP());
          return;
        }
        r = e.resolve(r);
        const g = (P) => I(r, e.normalize(p(P.entryName))), F = (P, v) => new Error(P + ': "' + v + '"'), O = [], x = [];
        h.entries.forEach((P) => {
          P.isDirectory ? O.push(P) : x.push(P);
        });
        for (const P of O) {
          const v = g(P), A = o ? P.header.fileAttr : void 0;
          try {
            S.makeDir(v), A && S.fs.chmodSync(v, A), S.fs.utimesSync(v, P.header.time, P.header.time);
          } catch {
            l(F("Unable to create folder", v));
          }
        }
        x.reverse().reduce(function(P, v) {
          return function(A) {
            if (A)
              P(A);
            else {
              const B = e.normalize(p(v.entryName)), U = I(r, B);
              v.getDataAsync(function(Z, $) {
                if ($)
                  P($);
                else if (!Z)
                  P(u.Errors.CANT_EXTRACT_FILE());
                else {
                  const J = o ? v.header.fileAttr : void 0;
                  S.writeFileToAsync(U, Z, m, J, function(Q) {
                    Q || P(F("Unable to write file", U)), S.fs.utimes(U, v.header.time, v.header.time, function(Ze) {
                      Ze ? P(F("Unable to set times", U)) : P();
                    });
                  });
                }
              });
            }
          };
        }, l)();
      },
      /**
       * Writes the newly created zip file to disk at the specified location or if a zip was opened and no ``targetFileName`` is provided, it will overwrite the opened zip
       *
       * @param {string} targetFileName
       * @param {function} callback
       */
      writeZip: function(r, m) {
        if (arguments.length === 1 && typeof r == "function" && (m = r, r = ""), !r && y.filename && (r = y.filename), !!r) {
          var o = h.compressToBuffer();
          if (o) {
            var l = S.writeFileTo(r, o, !0);
            typeof m == "function" && m(l ? null : new Error("failed"), "");
          }
        }
      },
      /**
      	         *
      	         * @param {string} targetFileName
      	         * @param {object} [props]
      	         * @param {boolean} [props.overwrite=true] If the file already exists at the target path, the file will be overwriten if this is true.
      	         * @param {boolean} [props.perm] The file will be set as the permission from the entry if this is true.
      
      	         * @returns {Promise<void>}
      	         */
      writeZipPromise: function(r, m) {
        const { overwrite: o, perm: l } = Object.assign({ overwrite: !0 }, m);
        return new Promise((g, F) => {
          !r && y.filename && (r = y.filename), r || F("ADM-ZIP: ZIP File Name Missing"), this.toBufferPromise().then((O) => {
            const x = (P) => P ? g(P) : F("ADM-ZIP: Wasn't able to write zip file");
            S.writeFileToAsync(r, O, o, l, x);
          }, F);
        });
      },
      /**
       * @returns {Promise<Buffer>} A promise to the Buffer.
       */
      toBufferPromise: function() {
        return new Promise((r, m) => {
          h.toAsyncBuffer(r, m);
        });
      },
      /**
       * Returns the content of the entire zip file as a Buffer object
       *
       * @prop {function} [onSuccess]
       * @prop {function} [onFail]
       * @prop {function} [onItemStart]
       * @prop {function} [onItemEnd]
       * @returns {Buffer}
       */
      toBuffer: function(r, m, o, l) {
        return typeof r == "function" ? (h.toAsyncBuffer(r, m, o, l), null) : h.compressToBuffer();
      }
    };
  }, de;
}
var rt = nt();
const it = /* @__PURE__ */ Ve(rt);
class R {
  static init(e) {
    this.baseDir = T.join(e, "profiles"), this.profilesJsonPath = T.join(e, "profiles.json"), N.existsSync(this.baseDir) || N.mkdirSync(this.baseDir, { recursive: !0 });
    const n = this.listProfiles();
    n.length === 0 ? this.createProfile("Default", "Default mod profile") : this.activeProfileId = n[0].id;
  }
  static getActiveProfileId() {
    return this.activeProfileId;
  }
  static setActiveProfileId(e) {
    if (!this.listProfiles().some((i) => i.id === e)) throw new Error(`Profile ${e} not found`);
    this.activeProfileId = e;
  }
  static listProfiles() {
    try {
      if (N.existsSync(this.profilesJsonPath)) {
        const e = N.readFileSync(this.profilesJsonPath, "utf-8");
        return JSON.parse(e);
      }
    } catch (e) {
      console.error("[ProfileService] Failed to read profiles.json:", e);
    }
    return [];
  }
  static saveProfiles(e) {
    const n = T.dirname(this.profilesJsonPath);
    N.existsSync(n) || N.mkdirSync(n, { recursive: !0 }), N.writeFileSync(this.profilesJsonPath, JSON.stringify(e, null, 2), "utf-8");
  }
  static getProfileModsDir(e) {
    const n = T.join(this.baseDir, e, "mods");
    return N.existsSync(n) || N.mkdirSync(n, { recursive: !0 }), n;
  }
  static getProfileModListPath(e) {
    return T.join(this.getProfileModsDir(e), "mod-list.json");
  }
  static createProfile(e, n) {
    const i = e.toLowerCase().replace(/[^a-z0-9]/g, "_") + "_" + Date.now().toString(36), c = this.listProfiles(), d = {
      id: i,
      name: e,
      description: n || "",
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    c.push(d), this.saveProfiles(c);
    const f = this.getProfileModsDir(i), E = {
      mods: [
        { name: "base", enabled: !0 },
        { name: "elevated-rails", enabled: !0 },
        { name: "quality", enabled: !0 },
        { name: "space-age", enabled: !0 }
      ]
    };
    return N.writeFileSync(T.join(f, "mod-list.json"), JSON.stringify(E, null, 2), "utf-8"), this.activeProfileId = i, d;
  }
  static duplicateProfile(e, n) {
    const i = this.getProfileModsDir(e), c = this.createProfile(n, `Copy of ${e}`), d = this.getProfileModsDir(c.id), f = N.readdirSync(i);
    for (const E of f)
      N.copyFileSync(T.join(i, E), T.join(d, E));
    return c;
  }
  static deleteProfile(e) {
    const n = this.listProfiles().filter((c) => c.id !== e);
    if (n.length === 0)
      throw new Error("Cannot delete the only remaining profile");
    this.saveProfiles(n);
    const i = T.join(this.baseDir, e);
    N.existsSync(i) && N.rmSync(i, { recursive: !0, force: !0 }), this.activeProfileId === e && (this.activeProfileId = n[0].id);
  }
  static async getInstalledMods(e) {
    var t;
    const n = this.getProfileModsDir(e), i = this.getProfileModListPath(e);
    let c = {};
    if (N.existsSync(i))
      try {
        const a = N.readFileSync(i, "utf-8"), D = JSON.parse(a);
        Array.isArray(D.mods) && D.mods.forEach((y) => {
          c[y.name] = y.enabled !== !1;
        });
      } catch (a) {
        console.error("[ProfileService] Error reading mod-list.json:", a);
      }
    const d = N.readdirSync(n), f = [], E = await H.getCatalog();
    for (const a of d) {
      const D = T.join(n, a);
      let y = a.endsWith(".zip"), S = !1;
      try {
        S = N.statSync(D).isDirectory();
      } catch {
      }
      if (!(!y && !S))
        try {
          let h = null, p, I = 0;
          if (y) {
            const C = new it(D), w = C.getEntries(), L = w.find((s) => s.entryName.endsWith("info.json") && !s.isDirectory);
            L && (h = C.readAsText(L));
            const _ = w.find(
              (s) => !s.isDirectory && (s.entryName.toLowerCase().endsWith("thumbnail.png") || s.entryName.toLowerCase().endsWith("thumbnail.jpg"))
            );
            if (_)
              try {
                const s = C.readFile(_);
                p = `data:${_.entryName.toLowerCase().endsWith(".jpg") ? "image/jpeg" : "image/png"};base64,${s.toString("base64")}`;
              } catch (s) {
                console.warn(`[ProfileService] Error reading thumbnail from ${a}:`, s);
              }
            try {
              I = N.statSync(D).size;
            } catch {
            }
          } else if (S) {
            const C = T.join(D, "info.json");
            N.existsSync(C) && (h = N.readFileSync(C, "utf-8"));
            const w = T.join(D, "thumbnail.png"), L = T.join(D, "thumbnail.jpg");
            if (N.existsSync(w))
              try {
                p = `data:image/png;base64,${N.readFileSync(w).toString("base64")}`;
              } catch {
              }
            else if (N.existsSync(L))
              try {
                p = `data:image/jpeg;base64,${N.readFileSync(L).toString("base64")}`;
              } catch {
              }
          }
          if (h) {
            const C = JSON.parse(h), w = C.name, L = C.version, _ = c[w] !== !1, s = q.parseDependencies(C.dependencies || []), r = E.find((l) => l.name.toLowerCase() === w.toLowerCase()), m = (t = r == null ? void 0 : r.latest_release) == null ? void 0 : t.version, o = m ? q.compareVersions(m, L) > 0 : !1;
            if (!p) {
              let l = H.getThumbnail(w) || (r == null ? void 0 : r.thumbnail);
              if (!l)
                try {
                  const g = await H.getModDetails(w);
                  g != null && g.thumbnail && (l = g.thumbnail);
                } catch {
                }
              l && (p = l.startsWith("http") ? l.replace(/^https?:\/\/mods\.factorio\.com\//, "https://assets-mod.factorio.com/") : `https://assets-mod.factorio.com${l.startsWith("/") ? "" : "/"}${l}`);
            }
            f.push({
              name: w,
              title: C.title || (r == null ? void 0 : r.title) || w,
              author: C.author || (r == null ? void 0 : r.owner) || "",
              summary: C.description || (r == null ? void 0 : r.summary) || "",
              version: L,
              enabled: _,
              fileName: a,
              fileSizeBytes: I,
              category: r == null ? void 0 : r.category,
              factorioVersion: C.factorio_version,
              dependencies: s,
              latestAvailableVersion: m,
              hasUpdate: o,
              thumbnail: p
            });
          }
        } catch (h) {
          console.warn(`[ProfileService] Error reading mod ${a}:`, h);
        }
    }
    return f;
  }
  static toggleMod(e, n, i) {
    const c = this.getProfileModListPath(e);
    let d = { mods: [] };
    if (N.existsSync(c))
      try {
        d = JSON.parse(N.readFileSync(c, "utf-8"));
      } catch {
      }
    const f = d.mods.find((E) => E.name === n);
    f ? f.enabled = i : d.mods.push({ name: n, enabled: i }), N.writeFileSync(c, JSON.stringify(d, null, 2), "utf-8");
  }
  static uninstallMod(e, n) {
    const i = this.getProfileModsDir(e), c = N.readdirSync(i);
    for (const f of c)
      if (f.toLowerCase().startsWith(n.toLowerCase() + "_") && f.endsWith(".zip"))
        try {
          N.unlinkSync(T.join(i, f));
        } catch (E) {
          console.error(`Failed to delete ${f}:`, E);
        }
    const d = this.getProfileModListPath(e);
    if (N.existsSync(d))
      try {
        const f = JSON.parse(N.readFileSync(d, "utf-8"));
        f.mods = f.mods.filter((E) => E.name !== n), N.writeFileSync(d, JSON.stringify(f, null, 2), "utf-8");
      } catch {
      }
  }
  static async exportProfileCode(e) {
    const i = this.listProfiles().find((E) => E.id === e);
    if (!i) throw new Error("Profile not found");
    const c = await this.getInstalledMods(e), d = {
      fmm: 1,
      name: i.name,
      description: i.description,
      mods: c.map((E) => ({
        name: E.name,
        version: E.version,
        enabled: E.enabled
      }))
    }, f = JSON.stringify(d);
    return Buffer.from(f).toString("base64");
  }
  static async importProfileCode(e, n) {
    try {
      const i = Buffer.from(e.trim(), "base64").toString("utf-8"), c = JSON.parse(i);
      if (!c.mods || !Array.isArray(c.mods))
        throw new Error("Invalid profile code format");
      const d = n || c.name || "Imported Profile", f = this.createProfile(d, c.description || "Imported via share code"), E = this.getProfileModsDir(f.id), t = [], a = [];
      for (const D of c.mods)
        if (!q.isBuiltin(D.name))
          try {
            const y = await G.installModWithDependencies(
              D.name,
              D.version,
              E,
              a
            );
            t.push(...y.errors), this.toggleMod(f.id, D.name, D.enabled !== !1);
          } catch (y) {
            t.push(`Failed to import ${D.name}: ${y == null ? void 0 : y.message}`);
          }
      return { profile: f, errors: t };
    } catch (i) {
      throw new Error(`Failed to parse profile code: ${i == null ? void 0 : i.message}`);
    }
  }
}
b(R, "baseDir", ""), b(R, "profilesJsonPath", ""), b(R, "activeProfileId", "default");
class j {
  static init(e) {
    this.settingsPath = T.join(e, "settings.json"), this.loadSettings(), (!this.settings.factorioExePath || !N.existsSync(this.settings.factorioExePath)) && this.autoDetectPaths();
  }
  static getSettings() {
    return { ...this.settings };
  }
  static updateSettings(e) {
    return this.settings = { ...this.settings, ...e }, this.saveSettings(), this.settings;
  }
  static loadSettings() {
    try {
      if (N.existsSync(this.settingsPath)) {
        const e = N.readFileSync(this.settingsPath, "utf-8");
        this.settings = { ...this.settings, ...JSON.parse(e) };
      }
    } catch (e) {
      console.warn("[FactorioService] Failed to load settings:", e);
    }
  }
  static saveSettings() {
    const e = T.dirname(this.settingsPath);
    N.existsSync(e) || N.mkdirSync(e, { recursive: !0 }), N.writeFileSync(this.settingsPath, JSON.stringify(this.settings, null, 2), "utf-8");
  }
  static autoDetectPaths() {
    const e = [
      "D:\\Games\\Factorio\\bin\\x64\\factorio.exe",
      "C:\\Program Files (x86)\\Steam\\steamapps\\common\\Factorio\\bin\\x64\\factorio.exe",
      "C:\\Program Files\\Steam\\steamapps\\common\\Factorio\\bin\\x64\\factorio.exe",
      "D:\\SteamLibrary\\steamapps\\common\\Factorio\\bin\\x64\\factorio.exe",
      "E:\\SteamLibrary\\steamapps\\common\\Factorio\\bin\\x64\\factorio.exe",
      "C:\\GOG Games\\Factorio\\bin\\x64\\factorio.exe"
    ];
    let n = null;
    for (const d of e)
      if (N.existsSync(d)) {
        n = d;
        break;
      }
    const i = T.join(process.env.APPDATA || "", "Factorio"), c = N.existsSync(i) ? i : null;
    return n && (this.settings.factorioExePath = n), c && (this.settings.factorioWritePath = c), this.saveSettings(), { exe: n, appData: c };
  }
  static launchModded(e) {
    const n = this.settings.factorioExePath;
    if (!n || !N.existsSync(n))
      return {
        success: !1,
        message: "Factorio executable not found! Please set the path in Settings."
      };
    const i = e || R.getActiveProfileId(), d = ["--mod-directory", R.getProfileModsDir(i)];
    this.settings.customLaunchArgs.trim() && d.push(...this.settings.customLaunchArgs.trim().split(/\s+/));
    try {
      console.log(`[FactorioService] Launching modded: "${n}" ${d.join(" ")}`);
      const f = Ee(n, d, {
        detached: !0,
        stdio: "ignore"
      });
      return f.unref(), {
        success: !0,
        pid: f.pid
      };
    } catch (f) {
      return {
        success: !1,
        message: `Failed to launch Factorio: ${f == null ? void 0 : f.message}`
      };
    }
  }
  static launchVanilla() {
    const e = this.settings.factorioExePath;
    if (!e || !N.existsSync(e))
      return {
        success: !1,
        message: "Factorio executable not found! Please set the path in Settings."
      };
    const n = [];
    this.settings.customLaunchArgs.trim() && n.push(...this.settings.customLaunchArgs.trim().split(/\s+/));
    try {
      console.log(`[FactorioService] Launching vanilla: "${e}" ${n.join(" ")}`);
      const i = Ee(e, n, {
        detached: !0,
        stdio: "ignore"
      });
      return i.unref(), {
        success: !0,
        pid: i.pid
      };
    } catch (i) {
      return {
        success: !1,
        message: `Failed to launch Factorio: ${i == null ? void 0 : i.message}`
      };
    }
  }
  static syncToGameDirectory(e) {
    try {
      const n = e || R.getActiveProfileId(), i = R.getProfileModsDir(n), c = T.join(this.settings.factorioWritePath, "mods");
      N.existsSync(c) || N.mkdirSync(c, { recursive: !0 });
      const d = N.readdirSync(i);
      let f = 0;
      const E = R.getProfileModListPath(n);
      N.existsSync(E) && N.copyFileSync(E, T.join(c, "mod-list.json"));
      for (const t of d)
        t.endsWith(".zip") && (N.copyFileSync(T.join(i, t), T.join(c, t)), f++);
      return { success: !0, count: f };
    } catch (n) {
      return console.error("[FactorioService] Error syncing to game directory:", n), { success: !1, count: 0, error: n == null ? void 0 : n.message };
    }
  }
}
b(j, "settingsPath", ""), b(j, "settings", {
  factorioExePath: "",
  factorioWritePath: T.join(process.env.APPDATA || "", "Factorio"),
  primaryMirror: "https://mods-storage.re146.dev/",
  customLaunchArgs: "",
  autoCheckUpdates: !0,
  concurrentDownloads: 3,
  closeOnLaunch: !1
});
const st = Ge(import.meta.url), Y = T.dirname(st);
let z = null;
function ot() {
  return W.getPath("userData");
}
function Ae() {
  je.setApplicationMenu(null);
  const u = T.join(Y, "../build/icon.ico"), e = T.join(Y, "../build/icon.png"), n = N.existsSync(u) ? u : N.existsSync(e) ? e : void 0;
  z = new Te({
    width: 1280,
    height: 820,
    minWidth: 1024,
    minHeight: 700,
    backgroundColor: "#17140f",
    title: "Foundry — mod manager",
    autoHideMenuBar: !0,
    icon: n,
    webPreferences: {
      nodeIntegration: !1,
      contextIsolation: !0,
      preload: T.join(Y, "preload.mjs")
    }
  }), z.setMenu(null), typeof z.removeMenu == "function" && z.removeMenu();
  const c = !W.isPackaged ? process.env.VITE_DEV_SERVER_URL || "http://localhost:5173" : `file://${T.join(Y, "../dist/index.html")}`;
  z.loadURL(c), z.webContents.setWindowOpenHandler(({ url: d }) => ($e.openExternal(d), { action: "deny" })), z.on("closed", () => {
    z = null;
  }), G.subscribe((d) => {
    z == null || z.webContents.send("downloads:progress", d);
  });
}
function at() {
  const u = ot();
  console.log(`[Main] Data directory: ${u}`), H.init(u), R.init(u), j.init(u), G.primaryMirror = j.getSettings().primaryMirror || "https://mods-storage.re146.dev/";
}
function ct() {
  M.handle("app:get-status", async () => {
    const u = R.getActiveProfileId(), e = R.listProfiles(), n = j.getSettings(), i = await R.getInstalledMods(u);
    return {
      ok: !0,
      activeProfileId: u,
      activeProfile: e.find((c) => c.id === u),
      installedCount: i.length,
      enabledCount: i.filter((c) => c.enabled).length,
      settings: n
    };
  }), M.handle("settings:get", () => j.getSettings()), M.handle("settings:update", (u, e) => {
    const n = j.updateSettings(e);
    return n.primaryMirror && (G.primaryMirror = n.primaryMirror), n;
  }), M.handle("settings:autodetect", () => {
    const u = j.autoDetectPaths();
    return { ...j.getSettings(), detected: u };
  }), M.handle("profiles:list", async () => {
    const u = R.listProfiles(), e = [];
    for (const n of u) {
      const i = await R.getInstalledMods(n.id);
      e.push({
        ...n,
        modsCount: i.length,
        enabledCount: i.filter((c) => c.enabled).length
      });
    }
    return e;
  }), M.handle("profiles:get-active", async () => {
    const u = R.getActiveProfileId(), n = R.listProfiles().find((c) => c.id === u);
    if (!n) throw new Error("Active profile not found");
    const i = await R.getInstalledMods(u);
    return {
      ...n,
      modsCount: i.length,
      enabledCount: i.filter((c) => c.enabled).length,
      mods: i
    };
  }), M.handle("profiles:set-active", (u, { id: e }) => (R.setActiveProfileId(e), { success: !0, activeProfileId: e })), M.handle("profiles:create", (u, { name: e, description: n }) => {
    if (!e) throw new Error("Name is required");
    return R.createProfile(e, n);
  }), M.handle("profiles:duplicate", (u, { id: e, name: n }) => R.duplicateProfile(e, n || `${e}_copy`)), M.handle("profiles:delete", (u, { id: e }) => (R.deleteProfile(e), { success: !0 })), M.handle("profiles:export", async (u, { id: e }) => ({ code: await R.exportProfileCode(e) })), M.handle("profiles:import", async (u, { code: e, name: n }) => {
    if (!e) throw new Error("Profile code is required");
    return await R.importProfileCode(e, n);
  }), M.handle("mods:search", async (u, e) => await H.searchMods({
    query: e.query,
    factorioVersion: e.factorioVersion,
    category: e.category,
    tag: e.tag,
    sortBy: e.sortBy,
    page: e.page ? parseInt(e.page, 10) : void 0,
    pageSize: e.pageSize ? parseInt(e.pageSize, 10) : void 0
  })), M.handle("mods:refresh-catalog", async () => ({ success: !0, count: (await H.getCatalog(!0)).length })), M.handle("mods:get-details", async (u, { name: e }) => {
    const n = await H.getModDetails(e);
    if (!n) throw new Error("Mod not found");
    return n;
  }), M.handle("mods:install", async (u, { name: e, version: n, profileId: i }) => {
    if (!e) throw new Error("Mod name is required");
    const c = i || R.getActiveProfileId(), d = R.getProfileModsDir(c), f = await R.getInstalledMods(c), E = await G.installModWithDependencies(
      e,
      n,
      d,
      f
    );
    for (const t of E.installed)
      R.toggleMod(c, t.name, !0);
    return {
      success: !0,
      installed: E.installed,
      errors: E.errors
    };
  }), M.handle("mods:toggle", (u, { name: e, enabled: n, profileId: i }) => {
    if (!e) throw new Error("Mod name is required");
    const c = i || R.getActiveProfileId();
    return R.toggleMod(c, e, n), { success: !0 };
  }), M.handle("mods:uninstall", (u, { name: e, profileId: n }) => {
    if (!e) throw new Error("Mod name is required");
    const i = n || R.getActiveProfileId();
    return R.uninstallMod(i, e), { success: !0 };
  }), M.handle("launch:modded", (u, { profileId: e } = {}) => j.launchModded(e)), M.handle("launch:vanilla", () => j.launchVanilla()), M.handle("launch:sync", (u, { profileId: e } = {}) => j.syncToGameDirectory(e)), M.handle("downloads:get-active", () => G.getActiveDownloads()), M.handle("dialog:open-file", async (u, e) => {
    if (!z) return null;
    const n = await me.showOpenDialog(z, {
      title: (e == null ? void 0 : e.title) || "Select File",
      properties: ["openFile"],
      filters: (e == null ? void 0 : e.filters) || [
        { name: "Executables", extensions: ["exe"] },
        { name: "All Files", extensions: ["*"] }
      ]
    });
    return n.canceled ? null : n.filePaths[0] || null;
  }), M.handle("dialog:open-directory", async (u, e) => {
    if (!z) return null;
    const n = await me.showOpenDialog(z, {
      title: (e == null ? void 0 : e.title) || "Select Directory",
      properties: ["openDirectory"]
    });
    return n.canceled ? null : n.filePaths[0] || null;
  });
}
W.whenReady().then(() => {
  at(), ct(), Ae(), W.on("activate", () => {
    Te.getAllWindows().length === 0 && Ae();
  });
});
W.on("window-all-closed", () => {
  process.platform !== "darwin" && W.quit();
});
