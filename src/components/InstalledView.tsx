import React, { useMemo } from 'react';
import { InstalledMod } from '../types';
import { checkModDependencies, formatBytes, getThumbnailUrl } from '../utils/helpers';

interface InstalledViewProps {
  mods: InstalledMod[];
  loading: boolean;
  selectedModName: string | null;
  onSelectMod: (name: string | null) => void;
  onToggleMod: (name: string, enabled: boolean) => void;
  onUninstallMod: (name: string) => void;
  onUpdateMod: (name: string, targetVersion: string) => void;
  onInstallMissingDep?: (name: string, version?: string) => void;
  onOpenChangelog?: (modName: string) => void;
  onGoToOnline: () => void;
  onRefresh: () => void;
  searchQuery: string;
  selectedCategory: string;
  selectedTag: string | null;
  sortBy: string;
  onSortByChange: (sort: string) => void;
}

export const InstalledView: React.FC<InstalledViewProps> = ({
  mods,
  loading,
  selectedModName,
  onSelectMod,
  onToggleMod,
  onUninstallMod,
  onUpdateMod,
  onInstallMissingDep,
  onOpenChangelog,
  onGoToOnline,
  onRefresh,
  searchQuery,
  selectedCategory,
  selectedTag,
  sortBy,
  onSortByChange,
}) => {
  // Compute dependencies status for all mods
  const evaluatedMods = useMemo(() => {
    return mods.map((mod) => {
      const depCheck = checkModDependencies(mod, mods);
      return {
        ...mod,
        depCheck,
      };
    });
  }, [mods]);

  // Filter mods based on search, category, and tag
  const filteredMods = useMemo(() => {
    return evaluatedMods.filter((mod) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesQuery =
          mod.title.toLowerCase().includes(q) ||
          mod.name.toLowerCase().includes(q) ||
          mod.author.toLowerCase().includes(q) ||
          mod.summary.toLowerCase().includes(q);
        if (!matchesQuery) return false;
      }

      // Tag filter
      if (selectedTag) {
        const t = selectedTag.toLowerCase();
        let matchesTag =
          mod.name.toLowerCase().includes(t) ||
          mod.title.toLowerCase().includes(t) ||
          mod.summary.toLowerCase().includes(t) ||
          (mod.author && mod.author.toLowerCase().includes(t));

        if (!matchesTag && t === 'space-age') {
          matchesTag =
            (mod.name + ' ' + mod.title).toLowerCase().includes('space age') ||
            (mod.dependencies && mod.dependencies.some(d => d.id.toLowerCase().includes('space-age')));
        }
        if (!matchesTag) return false;
      }

      // Category filter
      if (selectedCategory !== 'all') {
        const targetCat = selectedCategory.toLowerCase();
        const modCat = mod.category?.toLowerCase();

        if (modCat) {
          if (modCat !== targetCat) return false;
        } else {
          // Fallback heuristic for unindexed mods
          const text = `${mod.name} ${mod.title} ${mod.summary || ''}`.toLowerCase();
          if (targetCat === 'overhaul' && !text.match(/overhaul|space exploration|krastorio|seablock|bobs|angels|pyanodon/)) return false;
          if (targetCat === 'internal' && !text.match(/library|flib|stdlib|framework|internal/)) return false;
          if (targetCat === 'utilities' && !text.match(/qol|quality of life|squeak|planner|calc|rate|inventory|cursor|quick/)) return false;
          if (targetCat === 'tweaks' && !text.match(/tweak|balance|speed|stack|adjust/)) return false;
          if (targetCat === 'mod-packs' && !text.match(/pack|modpack/)) return false;
          if (targetCat === 'localizations' && !text.match(/locale|translation|language/)) return false;
        }
      }

      return true;
    });
  }, [evaluatedMods, searchQuery, selectedCategory, selectedTag]);

  // Sort mods
  const sortedMods = useMemo(() => {
    const list = [...filteredMods];
    if (sortBy === 'Name') {
      list.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === 'Recently updated') {
      list.sort((a, b) => (b.hasUpdate ? 1 : 0) - (a.hasUpdate ? 1 : 0));
    } else if (sortBy === 'Size') {
      list.sort((a, b) => (b.fileSizeBytes || 0) - (a.fileSizeBytes || 0));
    }
    // Default 'Load order' keeps natural list order
    return list;
  }, [filteredMods, sortBy]);

  // Find currently selected mod
  const selectedMod = useMemo(() => {
    if (!selectedModName) return null;
    return evaluatedMods.find((m) => m.name.toLowerCase() === selectedModName.toLowerCase()) || null;
  }, [selectedModName, evaluatedMods]);

  // Stats
  const enabledCount = mods.filter((m) => m.enabled).length;
  const needsAttentionCount = evaluatedMods.filter((m) => m.depCheck.hasIssues).length;
  const totalBytes = mods.reduce((sum, m) => sum + (m.fileSizeBytes || 0), 0);

  const handleEnableAll = () => {
    mods.forEach((m) => {
      if (!m.enabled) onToggleMod(m.name, true);
    });
  };

  const handleDisableAll = () => {
    mods.forEach((m) => {
      if (m.enabled) onToggleMod(m.name, false);
    });
  };

  const isOverhaul = (mod: InstalledMod) => {
    const text = `${mod.name} ${mod.title} ${mod.summary}`.toLowerCase();
    return text.match(/overhaul|space exploration|krastorio|seablock|bobs|angels|pyanodon|ultracube|nullius/);
  };

  const formatAuthor = (author?: string, maxAuthors = 2): string => {
    if (!author) return 'Unknown';
    const parts = author.split(/[,;]\s*/).filter(Boolean);
    if (parts.length > maxAuthors) {
      return `${parts.slice(0, maxAuthors).join(', ')}, et al.`;
    }
    return author;
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {/* List Header */}
      <div className="list-header">
        <div className="stat">
          <b>{enabledCount}</b> enabled
        </div>
        <div className="sep"></div>
        <div className="stat">
          <b style={{ color: needsAttentionCount > 0 ? 'var(--bad)' : 'var(--text)' }}>
            {needsAttentionCount}
          </b>{' '}
          needs attention
        </div>
        <div className="sep"></div>
        <div className="stat">{formatBytes(totalBytes)} on disk</div>

        <div className="right">
          {/* Enable / Disable all quick actions */}
          <div className="flex items-center gap-1.5 mr-2">
            <button
              onClick={handleEnableAll}
              className="px-2 py-1 text-xs rounded hover:bg-[var(--panel-2)] transition-colors"
              style={{ color: 'var(--text-dim)' }}
              title="Enable all mods"
            >
              Enable all
            </button>
            <span style={{ color: 'var(--line)' }}>|</span>
            <button
              onClick={handleDisableAll}
              className="px-2 py-1 text-xs rounded hover:bg-[var(--panel-2)] transition-colors"
              style={{ color: 'var(--text-dim)' }}
              title="Disable all mods"
            >
              Disable all
            </button>
          </div>

          <div className="sort">
            Sort
            <select value={sortBy} onChange={(e) => onSortByChange(e.target.value)}>
              <option>Load order</option>
              <option>Name</option>
              <option>Recently updated</option>
              <option>Size</option>
            </select>
          </div>

          <button
            onClick={onRefresh}
            className="p-1 rounded hover:bg-[var(--panel-2)] transition-colors"
            style={{ color: 'var(--text-dim)' }}
            title="Refresh mods list"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className={loading ? 'animate-spin' : ''}
            >
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content Row: Mod List + Right Drawer */}
      <div className="content-row">
        {/* Left: Mod List */}
        <div className="mod-list" id="modList">
          {mods.length === 0 ? (
            <div className="drawer-empty py-20">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
              <p>No mods installed in this profile yet.</p>
              <button className="btn btn-primary mt-2" onClick={onGoToOnline}>
                Browse online catalog
              </button>
            </div>
          ) : sortedMods.length === 0 ? (
            <div className="drawer-empty py-20">
              <p>No installed mods match your filters.</p>
            </div>
          ) : (
            sortedMods.map((mod) => {
              const isSelected = selectedModName?.toLowerCase() === mod.name.toLowerCase();
              const hasConflict = mod.depCheck.hasIssues;
              const overhaul = isOverhaul(mod);

              return (
                <div
                  key={mod.name}
                  className={`mod mod-installed ${isSelected ? 'selected' : ''} ${hasConflict ? 'conflict' : ''}`}
                  onClick={() => onSelectMod(isSelected ? null : mod.name)}
                >
                  {/* Mod Icon */}
                  <div className="mod-icon" key={mod.name + (mod.thumbnail || '')}>
                    {mod.thumbnail ? (
                      <img
                        key={mod.thumbnail}
                        src={getThumbnailUrl(mod.thumbnail)}
                        alt={mod.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                          const fb = (e.target as HTMLElement).nextElementSibling as HTMLElement;
                          if (fb) fb.style.display = 'block';
                        }}
                      />
                    ) : null}
                    <svg
                      style={{ display: mod.thumbnail ? 'none' : 'block' }}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                    >
                      <rect x="3" y="3" width="18" height="18" rx="3" />
                      <path d="M8 12h8M12 8v8" />
                    </svg>
                  </div>

                  {/* Mod Main Info */}
                  <div className="mod-main">
                    <div className="row1">
                      <span className="mod-name">{mod.title}</span>
                      {overhaul && <span className="mod-badge overhaul">Overhaul</span>}
                      {mod.hasUpdate && (
                        <span
                          className="mod-badge"
                          style={{
                            color: 'var(--warn)',
                            borderColor: 'var(--warn-bg)',
                            background: 'var(--warn-bg)',
                          }}
                        >
                          Update
                        </span>
                      )}
                    </div>

                    {hasConflict ? (
                      <div className="mod-warning">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 9v4M12 17h.01M10.3 3.9L2 18a2 2 0 0 0 1.7 3h16.6a2 2 0 0 0 1.7-3L14 3.9a2 2 0 0 0-3.4 0z" />
                        </svg>
                        {mod.depCheck.missing.length > 0
                          ? `Missing dependency — needs ${mod.depCheck.missing[0].id}`
                          : mod.depCheck.incompatible.length > 0
                          ? `Incompatible with ${mod.depCheck.incompatible[0].id}`
                          : `Version requirement not met`}
                      </div>
                    ) : (
                      <div className="mod-desc">{mod.summary || 'No description provided.'}</div>
                    )}
                  </div>

                  {/* Author */}
                  <div className="mod-author" title={mod.author || 'Unknown'}>
                    by <b>{formatAuthor(mod.author)}</b>
                  </div>

                  {/* Version */}
                  <div className="mod-version">{mod.version}</div>

                  {/* Download / Disk Size */}
                  <div className="mod-dl">{formatBytes(mod.fileSizeBytes)}</div>

                  {/* Inline Toggle Switch */}
                  <div
                    className={`switch ${mod.enabled ? 'on' : ''}`}
                    role="switch"
                    aria-checked={mod.enabled}
                    aria-label={mod.enabled ? `Disable ${mod.title}` : `Enable ${mod.title}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleMod(mod.name, !mod.enabled);
                    }}
                    title={mod.enabled ? 'Disable mod' : 'Enable mod'}
                  >
                    <i></i>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right: Detail Drawer */}
        <div className="drawer" id="drawer">
          {selectedMod ? (
            <>
              {/* Drawer Head */}
              <div className="drawer-head">
                <div className="drawer-icon" key={selectedMod.name}>
                  {selectedMod.thumbnail ? (
                    <img
                      key={selectedMod.thumbnail}
                      src={getThumbnailUrl(selectedMod.thumbnail)}
                      alt={selectedMod.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                        const fb = (e.target as HTMLElement).nextElementSibling as HTMLElement;
                        if (fb) fb.style.display = 'block';
                      }}
                    />
                  ) : null}
                  <svg
                    style={{ display: selectedMod.thumbnail ? 'none' : 'block' }}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="3" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </div>
                <div>
                  <div className="drawer-title">{selectedMod.title}</div>
                  <div className="drawer-by">
                    by <b>{selectedMod.author || 'Unknown'}</b> · v{selectedMod.version}
                  </div>
                </div>
              </div>

              {/* Drawer Description */}
              <p className="drawer-desc">{selectedMod.summary || 'No description provided.'}</p>

              {/* Drawer Actions */}
              <div className="drawer-actions">
                <button
                  className="btn"
                  style={{ flex: 'none', padding: '8px 14px' }}
                  onClick={() => onToggleMod(selectedMod.name, !selectedMod.enabled)}
                >
                  {selectedMod.enabled ? 'Disable' : 'Enable'}
                </button>

                {onOpenChangelog && (
                  <button
                    className="btn"
                    style={{ flex: 1 }}
                    onClick={() => onOpenChangelog(selectedMod.name)}
                  >
                    View changelog
                  </button>
                )}

                {selectedMod.hasUpdate && selectedMod.latestAvailableVersion && (
                  <button
                    className="btn btn-primary"
                    style={{ flex: 1 }}
                    onClick={() =>
                      onUpdateMod(selectedMod.name, selectedMod.latestAvailableVersion!)
                    }
                  >
                    Update (v{selectedMod.latestAvailableVersion})
                  </button>
                )}

                <button
                  className="btn"
                  style={{
                    flex: 'none',
                    padding: '8px 10px',
                    borderColor: 'rgba(193,90,63,0.3)',
                    color: 'var(--bad)',
                  }}
                  onClick={() => onUninstallMod(selectedMod.name)}
                  title="Uninstall mod"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
              </div>

              {/* Dependency Issue Note (if any) */}
              {selectedMod.depCheck.hasIssues && (
                <div className="drawer-section">
                  <h4>Dependency issue</h4>
                  <div className="dep-note">
                    {selectedMod.depCheck.missing.map((d) => (
                      <div key={d.id} className="mb-2">
                        <b>{d.id} {d.ineq} {d.version}</b> is required but not installed.
                        <br />
                        Fetch it from the official portal or mirror.
                        <br />
                        {onInstallMissingDep && (
                          <button
                            className="fix"
                            onClick={() => onInstallMissingDep(d.id, d.version)}
                          >
                            Fetch missing mod ({d.id})
                          </button>
                        )}
                      </div>
                    ))}

                    {selectedMod.depCheck.incompatible.map((d) => (
                      <div key={d.id} className="mb-1">
                        <b>Incompatible:</b> This mod conflicts with installed mod <b>{d.id}</b>.
                      </div>
                    ))}

                    {selectedMod.depCheck.unsatisfied.map((u) => (
                      <div key={u.dep.id} className="mb-1">
                        <b>Version mismatch:</b> Installed {u.dep.id} v{u.installedVersion} does not satisfy {u.dep.ineq} {u.dep.version}.
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Dependencies Section */}
              <div className="drawer-section">
                <h4>Dependencies</h4>
                {selectedMod.dependencies && selectedMod.dependencies.length > 0 ? (
                  selectedMod.dependencies.map((dep) => {
                    const isMissing = selectedMod.depCheck.missing.some((m) => m.id === dep.id);
                    const isIncompat = selectedMod.depCheck.incompatible.some((m) => m.id === dep.id);

                    let statusClass = 'ok';
                    let statusText = `${dep.ineq} ${dep.version} ok`.trim();
                    if (!statusText || statusText === 'ok') statusText = 'ok';

                    if (isMissing) {
                      statusClass = 'missing';
                      statusText = 'missing';
                    } else if (isIncompat) {
                      statusClass = 'missing';
                      statusText = 'conflict';
                    } else if (dep.type === 'optional') {
                      statusClass = 'mono text-dim';
                      statusText = 'optional';
                    }

                    return (
                      <div key={dep.raw} className="kv">
                        <span>{dep.id}</span>
                        <span className={statusClass}>{statusText}</span>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-xs" style={{ color: 'var(--text-faint)' }}>
                    No dependencies required.
                  </div>
                )}
              </div>

              {/* Details Section */}
              <div className="drawer-section">
                <h4>Details</h4>
                <div className="kv">
                  <span>Factorio version</span>
                  <span>{selectedMod.factorioVersion || '2.0'}</span>
                </div>
                <div className="kv">
                  <span>Size on disk</span>
                  <span>{formatBytes(selectedMod.fileSizeBytes)}</span>
                </div>
                <div className="kv">
                  <span>Status</span>
                  <span className={selectedMod.enabled ? 'ok' : ''}>
                    {selectedMod.enabled ? 'enabled' : 'disabled'}
                  </span>
                </div>
                <div className="kv">
                  <span>Archive</span>
                  <span className="truncate max-w-[150px]" title={selectedMod.fileName}>
                    {selectedMod.fileName}
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div className="drawer-empty">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M3 9h18M9 21V9" />
              </svg>
              <p>Select a mod from the list to view its dependencies, details, and actions.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
