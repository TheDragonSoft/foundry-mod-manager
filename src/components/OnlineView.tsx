import React, { useState, useEffect, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { InstalledMod, ModItem, ModRelease, ParsedDependency } from '../types';
import { api } from '../services/api';
import { getThumbnailUrl } from '../utils/helpers';

interface OnlineViewProps {
  installedMods: InstalledMod[];
  onInstallMod: (name: string, version?: string) => void;
  selectedModName: string | null;
  onSelectMod: (name: string | null) => void;
  installingModName: string | null;
  searchQuery: string;
  selectedCategory: string;
  selectedTag: string | null;
}

export const OnlineView: React.FC<OnlineViewProps> = ({
  installedMods,
  onInstallMod,
  selectedModName,
  onSelectMod,
  installingModName,
  searchQuery,
  selectedCategory,
  selectedTag,
}) => {
  const [items, setItems] = useState<ModItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [factorioVersion, setFactorioVersion] = useState('2.0');
  const [sortBy, setSortBy] = useState<'downloads' | 'score' | 'updated' | 'name'>('downloads');

  // Selected mod detail (full data fetched when clicked)
  const [fullModDetail, setFullModDetail] = useState<ModItem | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [selectedReleaseVersion, setSelectedReleaseVersion] = useState<string>('');
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});

  // Search and fetch catalog
  const fetchMods = async () => {
    setLoading(true);
    try {
      const catFilter = selectedCategory !== 'all' ? selectedCategory : undefined;

      const res = await api.searchMods({
        query: searchQuery.trim() || undefined,
        factorioVersion: factorioVersion !== 'all' ? factorioVersion : undefined,
        category: catFilter,
        tag: selectedTag || undefined,
        sortBy,
        page,
        pageSize: 30,
      });

      setItems(res.items || []);
      setTotal(res.total || 0);
      setPageCount(res.pageCount || 1);
    } catch (err) {
      console.error('Failed to search mods:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMods();
  }, [page, factorioVersion, selectedCategory, selectedTag, sortBy]);

  // Debounced search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchMods();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Lazy-resolve thumbnails for current page items if missing
  useEffect(() => {
    const missing = items.filter((m) => !m.thumbnail && !thumbnails[m.name]);
    if (missing.length === 0) return;

    let active = true;
    missing.forEach(async (m) => {
      try {
        const details = await api.getModDetails(m.name);
        if (active && details?.thumbnail) {
          setThumbnails((prev) => ({ ...prev, [m.name]: details.thumbnail! }));
        }
      } catch {}
    });

    return () => {
      active = false;
    };
  }, [items]);

  // Load detailed mod info when a mod is selected
  useEffect(() => {
    if (!selectedModName) {
      setFullModDetail(null);
      return;
    }

    let active = true;
    setLoadingDetail(true);

    api.getModDetails(selectedModName)
      .then((detail) => {
        if (!active) return;
        setFullModDetail(detail);
        const rels = detail.releases || (detail.latest_release ? [detail.latest_release] : []);
        if (rels.length > 0) {
          setSelectedReleaseVersion(rels[rels.length - 1].version);
        }
      })
      .catch((err) => {
        console.error('Failed to get mod details:', err);
      })
      .finally(() => {
        if (active) setLoadingDetail(false);
      });

    return () => {
      active = false;
    };
  }, [selectedModName]);

  const isModInstalled = (name: string) => {
    return installedMods.some((m) => m.name.toLowerCase() === name.toLowerCase());
  };

  const getInstalledMod = (name: string) => {
    return installedMods.find((m) => m.name.toLowerCase() === name.toLowerCase());
  };

  const formatDownloads = (count?: number) => {
    if (!count) return '0';
    if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
    if (count >= 1_000) return `${(count / 1_000).toFixed(0)}k`;
    return String(count);
  };

  const selectedRelease = useMemo(() => {
    if (!fullModDetail) return null;
    const rels = fullModDetail.releases || [];
    return rels.find((r) => r.version === selectedReleaseVersion) || fullModDetail.latest_release || null;
  }, [fullModDetail, selectedReleaseVersion]);

  // Parse release dependencies for display
  const releaseDeps = useMemo(() => {
    if (!selectedRelease?.info_json?.dependencies) return [];
    return selectedRelease.info_json.dependencies.map((depStr) => {
      const raw = depStr.trim();
      const regex = /^((?:)|(?:\?)|(?:\(\?\))|(?:!)|(?:~))(?:\s*)([a-zA-Z0-9_-]+)(?:\s*)((?:>=|<=|==|=|>|<)?)(?:\s*)([0-9]+(?:\.[0-9]+)*)?$/i;
      const match = raw.match(regex);
      const prefix = match ? match[1] : '';
      const id = match ? match[2] : depStr;
      const ineq = match ? (match[3] === '==' ? '=' : match[3] || '') : '';
      const version = match ? match[4] || '' : '';
      const isOptional = prefix === '?' || prefix === '(?)';
      const isIncompat = prefix === '!';
      return { id, ineq, version, isOptional, isIncompat, raw };
    });
  }, [selectedRelease]);

  const currentlySelectedSummary = items.find((m) => m.name.toLowerCase() === selectedModName?.toLowerCase());

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {/* List Header */}
      <div className="list-header">
        <div className="stat">
          <b>{total.toLocaleString()}</b> mods on Portal
        </div>
        <div className="sep"></div>
        <div className="stat">
          Factorio{' '}
          <select
            value={factorioVersion}
            onChange={(e) => {
              setFactorioVersion(e.target.value);
              setPage(1);
            }}
            className="ml-1"
          >
            <option value="2.0">2.0 (Space Age)</option>
            <option value="1.1">1.1</option>
            <option value="all">All versions</option>
          </select>
        </div>

        <div className="right">
          <div className="sort">
            Sort
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value as any);
                setPage(1);
              }}
            >
              <option value="downloads">Most downloaded</option>
              <option value="score">Top rated</option>
              <option value="updated">Recently updated</option>
              <option value="name">Name</option>
            </select>
          </div>

          <button
            onClick={fetchMods}
            className="p-1 rounded hover:bg-[var(--panel-2)] transition-colors"
            style={{ color: 'var(--text-dim)' }}
            title="Refresh catalog"
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
        {/* Mod List */}
        <div className="mod-list" id="modList">
          {loading && items.length === 0 ? (
            <div className="drawer-empty py-20">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
              <p>Fetching mods from official portal…</p>
            </div>
          ) : items.length === 0 ? (
            <div className="drawer-empty py-20">
              <p>No online mods match your search and filter criteria.</p>
            </div>
          ) : (
            items.map((mod) => {
              const isSelected = selectedModName?.toLowerCase() === mod.name.toLowerCase();
              const installed = isModInstalled(mod.name);
              const isInstalling = installingModName === mod.name;
              const isOverhaul = mod.category === 'overhaul' || mod.title.toLowerCase().includes('space exploration');
              const thumbUrl = getThumbnailUrl(mod.thumbnail || thumbnails[mod.name]);

              return (
                <div
                  key={mod.name}
                  className={`mod ${isSelected ? 'selected' : ''}`}
                  onClick={() => onSelectMod(isSelected ? null : mod.name)}
                >
                  {/* Thumbnail / Icon */}
                  <div className="mod-icon">
                    {thumbUrl ? (
                      <img
                        src={thumbUrl}
                        alt={mod.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                          const fb = (e.target as HTMLElement).nextElementSibling as HTMLElement;
                          if (fb) fb.style.display = 'block';
                        }}
                      />
                    ) : null}
                    <svg
                      style={{ display: thumbUrl ? 'none' : 'block' }}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                    >
                      <circle cx="12" cy="12" r="9" />
                      <path d="M3.6 9h16.8M3.6 15h16.8" />
                    </svg>
                  </div>

                  {/* Main */}
                  <div className="mod-main">
                    <div className="row1">
                      <span className="mod-name">{mod.title}</span>
                      {isOverhaul && <span className="mod-badge overhaul">Overhaul</span>}
                      {mod.category && !isOverhaul && (
                        <span className="mod-badge">{mod.category}</span>
                      )}
                    </div>
                    <div className="mod-desc">{mod.summary || 'No summary available.'}</div>
                  </div>

                  {/* Author */}
                  <div className="mod-author" title={mod.owner}>
                    by <b>{mod.owner}</b>
                  </div>

                  {/* Version */}
                  <div className="mod-version">{mod.latest_release?.version || '—'}</div>

                  {/* Downloads count */}
                  <div className="mod-dl">{formatDownloads(mod.downloads_count)} dl</div>

                  {/* Quick Action */}
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center justify-end"
                  >
                    {installed ? (
                      <span className="mono text-xs" style={{ color: 'var(--good)' }}>
                        ✓ on
                      </span>
                    ) : (
                      <button
                        className="btn btn-primary"
                        style={{ padding: '4px 10px', fontSize: '12px' }}
                        disabled={isInstalling}
                        onClick={() => onInstallMod(mod.name, mod.latest_release?.version)}
                      >
                        {isInstalling ? '…' : '+ Get'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {/* Pagination */}
          {pageCount > 1 && (
            <div className="flex items-center justify-between py-4 text-xs" style={{ color: 'var(--text-dim)' }}>
              <button
                className="btn"
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                ← Previous
              </button>
              <span>
                Page <b style={{ color: 'var(--text)' }}>{page}</b> of {pageCount}
              </span>
              <button
                className="btn"
                disabled={page >= pageCount || loading}
                onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
              >
                Next →
              </button>
            </div>
          )}
        </div>

        {/* Right Drawer for Online Mod */}
        <div className="drawer" id="drawer">
          {selectedModName ? (
            loadingDetail && !fullModDetail ? (
              <div className="drawer-empty">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
                <p>Loading mod details from portal…</p>
              </div>
            ) : fullModDetail || currentlySelectedSummary ? (
              <>
                {/* Drawer Head */}
                {(() => {
                  const drawerThumbUrl = getThumbnailUrl(
                    fullModDetail?.thumbnail ||
                    currentlySelectedSummary?.thumbnail ||
                    (selectedModName ? thumbnails[selectedModName] : undefined)
                  );
                  return (
                    <div className="drawer-head">
                      <div className="drawer-icon">
                        {drawerThumbUrl ? (
                          <img
                            src={drawerThumbUrl}
                            alt={fullModDetail?.title || currentlySelectedSummary?.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                              const fb = (e.target as HTMLElement).nextElementSibling as HTMLElement;
                              if (fb) fb.style.display = 'block';
                            }}
                          />
                        ) : null}
                        <svg
                          style={{ display: drawerThumbUrl ? 'none' : 'block' }}
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.6"
                        >
                          <circle cx="12" cy="12" r="10" />
                          <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                        </svg>
                      </div>
                      <div>
                        <div className="drawer-title">
                          {fullModDetail?.title || currentlySelectedSummary?.title}
                        </div>
                        <div className="drawer-by">
                          by <b>{fullModDetail?.owner || currentlySelectedSummary?.owner}</b>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Version Selector */}
                {fullModDetail?.releases && fullModDetail.releases.length > 0 && (
                  <div className="mb-3 flex items-center justify-between text-xs">
                    <span style={{ color: 'var(--text-dim)' }}>Target release:</span>
                    <select
                      value={selectedReleaseVersion}
                      onChange={(e) => setSelectedReleaseVersion(e.target.value)}
                    >
                      {fullModDetail.releases.map((rel) => (
                        <option key={rel.version} value={rel.version}>
                          v{rel.version} ({rel.factorio_version || '2.0'})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Primary Action Button */}
                <div className="drawer-actions">
                  {isModInstalled(selectedModName) ? (
                    <div
                      className="btn"
                      style={{
                        flex: 1,
                        background: 'var(--good-bg)',
                        borderColor: 'var(--good)',
                        color: 'var(--good)',
                      }}
                    >
                      ✓ Already Installed (v{getInstalledMod(selectedModName)?.version})
                    </div>
                  ) : (
                    <button
                      className="btn btn-primary"
                      style={{ flex: 1 }}
                      disabled={installingModName === selectedModName}
                      onClick={() =>
                        onInstallMod(
                          selectedModName,
                          selectedReleaseVersion || fullModDetail?.latest_release?.version
                        )
                      }
                    >
                      {installingModName === selectedModName ? 'Downloading…' : 'Install Mod'}
                    </button>
                  )}
                </div>

                {/* Summary / Description */}
                <div className="drawer-section">
                  <h4>About this mod</h4>
                  <p className="drawer-desc" style={{ marginTop: 0 }}>
                    {fullModDetail?.summary || currentlySelectedSummary?.summary || 'No summary available.'}
                  </p>
                </div>

                {/* Dependencies */}
                {releaseDeps.length > 0 && (
                  <div className="drawer-section">
                    <h4>Dependencies</h4>
                    {releaseDeps.map((dep) => {
                      const installed = isModInstalled(dep.id);
                      let statusClass = installed ? 'ok' : 'missing';
                      let statusText = installed ? 'installed' : 'missing';

                      if (dep.isOptional) {
                        statusClass = 'mono text-dim';
                        statusText = 'optional';
                      }

                      return (
                        <div key={dep.raw} className="kv">
                          <span>{dep.id} {dep.ineq} {dep.version}</span>
                          <span className={statusClass}>{statusText}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Details */}
                <div className="drawer-section">
                  <h4>Details</h4>
                  <div className="kv">
                    <span>Downloads</span>
                    <span>
                      {formatDownloads(fullModDetail?.downloads_count || currentlySelectedSummary?.downloads_count)}
                    </span>
                  </div>
                  {fullModDetail?.score !== undefined && (
                    <div className="kv">
                      <span>Rating</span>
                      <span>★ {fullModDetail.score.toFixed(1)}</span>
                    </div>
                  )}
                  {fullModDetail?.license && (
                    <div className="kv">
                      <span>License</span>
                      <span>{fullModDetail.license.name || fullModDetail.license.id || 'Custom'}</span>
                    </div>
                  )}
                  {fullModDetail?.homepage && (
                    <div className="kv">
                      <span>Homepage</span>
                      <a
                        href={fullModDetail.homepage}
                        target="_blank"
                        rel="noreferrer"
                        className="truncate max-w-[160px] underline"
                        style={{ color: 'var(--copper)' }}
                      >
                        Visit
                      </a>
                    </div>
                  )}
                </div>
              </>
            ) : null
          ) : (
            <div className="drawer-empty">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <p>Select any mod from the catalog to review its release versions, description, and dependencies.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
