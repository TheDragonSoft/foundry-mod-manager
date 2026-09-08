import { ParsedDependency } from '../../src/types';

export class DependencyService {
  // Built-in base factorio packages that are part of the game/DLC
  static BUILTIN_PACKAGES = new Set(['base', 'core', 'elevated-rails', 'quality', 'space-age']);

  static parseDependencyString(depStr: string): ParsedDependency {
    const raw = depStr.trim();
    const regex = /^((?:)|(?:\?)|(?:\(\?\))|(?:!)|(?:~))(?:\s*)([a-zA-Z0-9_-]+)(?:\s*)((?:>=|<=|==|=|>|<)?)(?:\s*)([0-9]+(?:\.[0-9]+)*)?$/i;
    const match = raw.match(regex);

    if (!match) {
      return {
        id: raw.replace(/[?!~()=><]/g, '').trim(),
        type: 'required',
        ineq: '',
        version: '',
        raw,
      };
    }

    const prefix = match[1];
    const id = match[2];
    const ineq = match[3] === '==' ? '=' : match[3] || '';
    const version = match[4] || '';

    let type: ParsedDependency['type'] = 'required';
    if (prefix === '?' ) type = 'optional';
    else if (prefix === '(?)') type = 'hidden_optional';
    else if (prefix === '!') type = 'incompatible';
    else if (prefix === '~') type = 'order_only';

    return { id, type, ineq, version, raw };
  }

  static parseDependencies(dependencies: string[] = []): ParsedDependency[] {
    return dependencies.map(dep => this.parseDependencyString(dep));
  }

  static compareVersions(v1: string, v2: string): number {
    const p1 = v1.split('.').map(Number);
    const p2 = v2.split('.').map(Number);
    const maxLen = Math.max(p1.length, p2.length);

    for (let i = 0; i < maxLen; i++) {
      const num1 = p1[i] || 0;
      const num2 = p2[i] || 0;
      if (num1 > num2) return 1;
      if (num1 < num2) return -1;
    }
    return 0;
  }

  static satisfies(installedVersion: string, ineq: string, requiredVersion: string): boolean {
    if (!ineq || !requiredVersion) return true;
    const cmp = this.compareVersions(installedVersion, requiredVersion);

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

  static isBuiltin(modId: string): boolean {
    return this.BUILTIN_PACKAGES.has(modId.toLowerCase());
  }
}
