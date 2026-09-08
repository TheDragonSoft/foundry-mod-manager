import React, { useMemo } from 'react';
import { InstalledMod, ModItem, ParsedDependency } from '../types';
import { Badge, IconButton, Button, Switch } from '../primitives';
import { getThumbnailUrl } from '../utils/helpers';

export interface DetailRailProps {
  mod?: (InstalledMod & { downloads_count?: number }) | null;
  isOpen?: boolean;
  onClose: () => void;
  onToggleMod?: (name: string, enabled: boolean) => void;
  onUninstallMod?: (name: string) => void;
  onUpdateMod?: (name: string, targetVersion: string) => void;
  onInstallMissingDep?: (name: string, version?: string) => void;
  onOpenChangelog?: (modName: string) => void;
  mods?: InstalledMod[];
  // Discover / Online props
  modName?: string | null;
  modDetail?: ModItem;
  currentlySelectedSummary?: ModItem;
  loading?: boolean;
  selectedReleaseVersion?: string;
  onReleaseVersionChange?: (version: string) => void;
  installedMods?: InstalledMod[];
  onInstallMod?: (modName: string, version?: string) => void;
  installingModName?: string | null;
}

export const DetailRail: React.FC<DetailRailProps> = ({
  mod: modProp,
  isOpen: isOpenProp,
  onClose,
  onToggleMod = () => {},
  onUninstallMod = () => {},
  onUpdateMod = () => {},
  onInstallMissingDep,
  onOpenChangelog,
  mods = [],
  modName,
  modDetail,
  currentlySelectedSummary,
  loading = false,
  selectedReleaseVersion,
  onReleaseVersionChange,
  installedMods = [],
  onInstallMod,
  installingModName,
}) => {
  const activeMods = mods.length > 0 ? mods : installedMods;
  const isOpen = isOpenProp !== undefined ? isOpenProp : !!(modProp || modName);

  const mod = useMemo(() => {
    if (modProp) return modProp;
    if (modDetail || currentlySelectedSummary) {
      const summary = modDetail || currentlySelectedSummary!;
      return {
        name: summary.name,
        title: summary.title,
        author: summary.owner,
        summary: summary.summary || '',
        version: selectedReleaseVersion || summary.latest_release?.version || '—',
        enabled: false,
        fileName: '',
        dependencies: (summary.latest_release?.info_json?.dependencies || []) as any,
        downloads_count: summary.downloads_count,
        thumbnail: summary.thumbnail,
      } as InstalledMod & { downloads_count?: number };
    }
    return null;
  }, [modProp, modDetail, currentlySelectedSummary, selectedReleaseVersion]);

  const dependencies = useMemo(() => {
    if (!mod?.dependencies) return [];
    return mod.dependencies.map((dep: any) => {
      const raw = typeof dep === 'string' ? dep.trim() : (dep.raw || dep.id || '');
      const regex = /^((?:)|(?:\?)|(?:\(\?\))|(?:!)|(?:~))(?:\s*)([a-zA-Z0-9_-]+)(?:\s*)((?:>=|<=|==|=|>|<)?)(?:\s*)([0-9]+(?:\.[0-9]+)*)?$/i;
      const match = typeof raw === 'string' ? raw.match(regex) : null;
      const prefix = match ? match[1] : (dep.type === 'optional' ? '?' : dep.type === 'incompatible' ? '!' : '');
      const id = match ? match[2] : (dep.id || raw || '');
      const ineq = match ? (match[3] === '==' ? '=' : match[3] || '') : (dep.ineq || '');
      const version = match ? match[4] || '' : (dep.version || '');
      const isOptional = prefix === '?' || prefix === '(?)' || dep.type === 'optional';
      const isIncompat = prefix === '!' || dep.type === 'incompatible';
      
      // Check if dependency is satisfied
      const installedMod = activeMods.find(m => m.name.toLowerCase() === id.toLowerCase());
      let status: 'ok' | 'missing' | 'version-mismatch' = 'ok';
      
      if (isIncompat) {
        status = installedMod ? 'missing' : 'ok';
      } else if (!installedMod) {
        status = isOptional ? 'ok' : 'missing';
      } else if (ineq && version) {
        const [installedMajor, installedMinor] = installedMod.version.split('.').map(Number);
        const [requiredMajor, requiredMinor] = version.split('.').map(Number);
        
        if (ineq === '>=' && (installedMajor < requiredMajor || (installedMajor === requiredMajor && installedMinor < requiredMinor))) {
          status = 'version-mismatch';
        } else if (ineq === '>' && (installedMajor <= requiredMajor || (installedMajor === requiredMajor && installedMinor <= requiredMinor))) {
          status = 'version-mismatch';
        } else if (ineq === '<=' && (installedMajor > requiredMajor || (installedMajor === requiredMajor && installedMinor > requiredMinor))) {
          status = 'version-mismatch';
        } else if (ineq === '<' && (installedMajor >= requiredMajor || (installedMajor === requiredMajor && installedMinor >= requiredMinor))) {
          status = 'version-mismatch';
        } else if (ineq === '=' && (installedMajor !== requiredMajor || installedMinor !== requiredMinor)) {
          status = 'version-mismatch';
        }
      }
      
      return { id, ineq, version, isOptional, isIncompat, raw, status, installed: !!installedMod };
    });
  }, [mod, activeMods]);

  if (!mod) {
    return null;
  }

  return (
    <div 
      className={`detail-rail ${isOpen ? 'open' : 'closed'}`}
      role="tabpanel"
      aria-label="Mod details"
    >
      {/* Header */}
      <div className="detail-rail-header">
        <div className="detail-rail-title-row">
          <h3 className="detail-rail-title">{mod.title}</h3>
          <IconButton
            icon="close"
            onClick={onClose}
            aria-label="Close details"
            tooltip="Close (Esc)"
            size="sm"
          />
        </div>
        <div className="detail-rail-version-row">
          <Badge tone="neutral" variant="outline">v{mod.version}</Badge>
          {mod.hasUpdate && (
            <Badge tone="warn" variant="subtle">Update available</Badge>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="detail-rail-body">
        {/* Dependencies Section */}
        <section className="detail-rail-section">
          <h4 className="detail-rail-section-title">Dependencies</h4>
          {dependencies.length === 0 ? (
            <p className="detail-rail-empty">No dependencies</p>
          ) : (
            <ul className="detail-rail-deps-list">
              {dependencies.map((dep) => (
                <li key={dep.id} className="detail-rail-dep-item">
                  <span className="detail-rail-dep-name mono">{dep.id}</span>
                  {dep.ineq && dep.version && (
                    <span className="detail-rail-dep-range mono text-3">
                      {' '}{dep.ineq}{dep.version}
                    </span>
                  )}
                  <Badge 
                    tone={dep.status === 'ok' ? 'success' : dep.status === 'missing' ? 'danger' : 'warn'}
                    variant="subtle"
                    size="sm"
                  >
                    {dep.status === 'ok' ? 'ok' : dep.status === 'missing' ? 'missing' : 'version'}
                  </Badge>
                  {dep.status === 'missing' && !dep.isIncompat && onInstallMissingDep && (
                    <button
                      className="btn btn-secondary btn-sm ml-auto"
                      onClick={() => onInstallMissingDep(dep.id, dep.version || undefined)}
                    >
                      + Get
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Details Section */}
        <section className="detail-rail-section">
          <h4 className="detail-rail-section-title">Details</h4>
          <dl className="detail-rail-details">
            <div className="detail-rail-detail-row">
              <dt>Author</dt>
              <dd>{mod.author || 'Unknown'}</dd>
            </div>
            {mod.downloads_count !== undefined && (
              <div className="detail-rail-detail-row">
                <dt>Downloads</dt>
                <dd className="mono">{formatDownloads(mod.downloads_count)}</dd>
              </div>
            )}
            <div className="detail-rail-detail-row">
              <dt>Size</dt>
              <dd className="mono">{formatBytes(mod.fileSizeBytes)}</dd>
            </div>
            {mod.category && (
              <div className="detail-rail-detail-row">
                <dt>Category</dt>
                <dd>{mod.category}</dd>
              </div>
            )}
          </dl>
        </section>

        {/* Actions Section */}
        <section className="detail-rail-section">
          <h4 className="detail-rail-section-title">Actions</h4>
          <div className="detail-rail-actions">
            <div className="detail-rail-action-row">
              <span>Enable mod</span>
              <Switch
                checked={mod.enabled}
                onChange={(enabled) => onToggleMod(mod.name, enabled)}
                aria-label={mod.enabled ? `Disable ${mod.title}` : `Enable ${mod.title}`}
                size="md"
              />
            </div>
            <div className="detail-rail-actions-buttons">
              {onOpenChangelog && (
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => onOpenChangelog(mod.name)}
                >
                  View changelog
                </Button>
              )}
              {mod.hasUpdate && mod.latestAvailableVersion && (
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => onUpdateMod(mod.name, mod.latestAvailableVersion!)}
                >
                  Update to {mod.latestAvailableVersion}
                </Button>
              )}
              <Button
                variant="danger"
                size="md"
                onClick={() => onUninstallMod(mod.name)}
              >
                Remove
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

function formatDownloads(count?: number): string {
  if (!count) return '0';
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(0)}k`;
  return String(count);
}

function formatBytes(bytes?: number): string {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}
