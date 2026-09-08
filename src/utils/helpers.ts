import { InstalledMod, ParsedDependency } from '../types';

export const BUILTIN_PACKAGES = new Set(['base', 'core', 'elevated-rails', 'quality', 'space-age']);

export function getThumbnailUrl(path?: string): string | undefined {
  if (!path) return undefined;
  const trimmed = path.trim();
  if (!trimmed) return undefined;
  if (trimmed.startsWith('data:')) return trimmed;
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed.replace(/^https?:\/\/mods\.factorio\.com\//, 'https://assets-mod.factorio.com/');
  }
  return `https://assets-mod.factorio.com${trimmed.startsWith('/') ? '' : '/'}${trimmed}`;
}

export function formatBytes(bytes?: number): string {
  if (!bytes || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const val = bytes / Math.pow(1024, i);
  return `${val < 10 && i > 0 ? val.toFixed(1) : Math.round(val)} ${units[i]}`;
}

export function compareVersions(v1: string, v2: string): number {
  const p1 = (v1 || '0').split('.').map(Number);
  const p2 = (v2 || '0').split('.').map(Number);
  const maxLen = Math.max(p1.length, p2.length);

  for (let i = 0; i < maxLen; i++) {
    const num1 = p1[i] || 0;
    const num2 = p2[i] || 0;
    if (num1 > num2) return 1;
    if (num1 < num2) return -1;
  }
  return 0;
}

export function satisfiesVersion(installedVer: string, ineq: string, requiredVer: string): boolean {
  if (!ineq || !requiredVer) return true;
  const cmp = compareVersions(installedVer, requiredVer);
  switch (ineq) {
    case '>=': return cmp >= 0;
    case '<=': return cmp <= 0;
    case '>':  return cmp > 0;
    case '<':  return cmp < 0;
    case '=':
    case '==': return cmp === 0;
    default:   return true;
  }
}

export interface DependencyCheckResult {
  hasIssues: boolean;
  missing: ParsedDependency[];
  incompatible: ParsedDependency[];
  unsatisfied: { dep: ParsedDependency; installedVersion: string }[];
}

export function checkModDependencies(mod: InstalledMod, allMods: InstalledMod[]): DependencyCheckResult {
  const installedMap = new Map<string, InstalledMod>();
  allMods.forEach(m => installedMap.set(m.name.toLowerCase(), m));

  const missing: ParsedDependency[] = [];
  const incompatible: ParsedDependency[] = [];
  const unsatisfied: { dep: ParsedDependency; installedVersion: string }[] = [];

  for (const dep of mod.dependencies || []) {
    const depIdLower = dep.id.toLowerCase();

    if (dep.type === 'incompatible') {
      if (installedMap.has(depIdLower)) {
        incompatible.push(dep);
      }
      continue;
    }

    if (dep.type === 'required') {
      if (BUILTIN_PACKAGES.has(depIdLower)) {
        // Builtin packages are provided by the game
        continue;
      }

      const match = installedMap.get(depIdLower);
      if (!match) {
        missing.push(dep);
      } else if (dep.version && dep.ineq) {
        if (!satisfiesVersion(match.version, dep.ineq, dep.version)) {
          unsatisfied.push({ dep, installedVersion: match.version });
        }
      }
    }
  }

  return {
    hasIssues: missing.length > 0 || incompatible.length > 0 || unsatisfied.length > 0,
    missing,
    incompatible,
    unsatisfied,
  };
}
