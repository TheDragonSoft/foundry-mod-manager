import React, { useState, useEffect, useMemo } from 'react';
import { InstalledMod, ModItem, ModRelease, ParsedDependency } from '../../types';
import { api } from '../../services/api';
import { getThumbnailUrl } from '../../utils/helpers';
import { ModRow } from '../../components/ModRow';
import { DetailRail } from '../../components/DetailRail';
import { Select } from '../../primitives/Select';
import { IconButton } from '../../primitives/IconButton';
import { Badge } from '../../primitives/Badge';
import { Switch } from '../../primitives/Switch';
import { Button } from '../../primitives/Button';

interface DiscoverViewProps {
  installedMods: InstalledMod[];
  onInstallMod: (name: string, version?: string) => void;
  selectedModName: string | null;
  onSelectMod: (name: string | null) => void;
  installingModName: string | null;
  searchQuery: string;
  selectedCategory: string;
  selectedTag: string | null;
}

export const DiscoverView: React.FC<DiscoverViewProps> = ({
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

  // Selected mod detail
  const [fullModDetail, setFullModDetail] = useState<ModItem | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [selectedReleaseVersion, setSelectedReleaseVersion] = useState<string>('');
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});

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

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchMods();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

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

  useEffect(() => {
    if (!selectedModName) {
      setFullModDetail(null);
      return;
    }

    let active = true;
    setLoadingDetail(true);

    api
      .getModDetails(selectedModName)
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

  const handleInstall = (modName: string, version?: string) => {
    onInstallMod(modName, version);
  };

  const sortOptions = [
    { value: 'downloads', label: 'Most downloaded' },
    { value: 'score', label: 'Top rated' },
    { value: 'updated', label: 'Recently updated' },
    { value: 'name', label: 'Name' },
  ];

  const versionOptions = [
    { value: '2.0', label: '2.0 (Space Age)' },
    { value: '1.1', label: '1.1' },
    { value: 'all', label: 'All versions' },
  ];

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {/* Toolbar */}
      <div className="list-header">
        <div className="stat">
          <b>{total.toLocaleString()}</b> mods on Portal
        </div>
        <div className="sep"></div>
        <div className="stat">
          Factorio{' '}
          <Select
            value={factorioVersion}
            onChange={(e) => {
              setFactorioVersion(e.target.value);
              setPage(1);
            }}
            options={versionOptions}
            className="ml-1"
          />
        </div>

        <div className="right">
          <div className="sort">
            Sort
            <Select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value as any);
                setPage(1);
              }}
              options={sortOptions}
            />
          </div>

          <IconButton
            icon="refresh"
            onClick={fetchMods}
            title="Refresh catalog"
            disabled={loading}
          />
        </div>
      </div>

      {/* Content Row: Mod List + Detail Rail */}
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
              const thumbUrl = getThumbnailUrl(mod.thumbnail || thumbnails[mod.name]);

              return (
                <ModRow
                  key={mod.name}
                  name={mod.name}
                  title={mod.title}
                  summary={mod.summary || 'No summary available.'}
                  author={mod.owner}
                  version={mod.latest_release?.version || '—'}
                  downloads={formatDownloads(mod.downloads_count)}
                  thumbnail={thumbUrl}
                  category={mod.category}
                  isSelected={isSelected}
                  installed={installed}
                  installing={isInstalling}
                  showGetButton={!installed}
                  onClick={() => onSelectMod(isSelected ? null : mod.name)}
                  onInstall={() => handleInstall(mod.name, mod.latest_release?.version)}
                />
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

        {/* Detail Rail */}
        <DetailRail
          modName={selectedModName}
          modDetail={fullModDetail || undefined}
          currentlySelectedSummary={items.find((m) => m.name.toLowerCase() === selectedModName?.toLowerCase())}
          loading={loadingDetail}
          onClose={() => onSelectMod(null)}
          selectedReleaseVersion={selectedReleaseVersion}
          onReleaseVersionChange={setSelectedReleaseVersion}
          installedMods={installedMods}
          onInstallMod={handleInstall}
          installingModName={installingModName}
        />
      </div>
    </div>
  );
};
