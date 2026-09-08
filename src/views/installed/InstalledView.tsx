import React, { useMemo } from 'react';
import { InstalledMod } from '../../types';
import { checkModDependencies, formatBytes } from '../../utils/helpers';
import { ModRow } from '../../components/ModRow';
import { DetailRail } from '../../components/DetailRail';
import { Button, IconButton, Select, Badge, Switch, EmptyState } from '../../primitives';

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
      return { ...mod, depCheck };
    });
  }, [mods]);

  // Filter mods based on search, category, and tag
  const filteredMods = useMemo(() => {
    return evaluatedMods.filter((mod) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesQuery =
          mod.title.toLowerCase().includes(q) ||
          mod.name.toLowerCase().includes(q) ||
          mod.author.toLowerCase().includes(q) ||
          mod.summary.toLowerCase().includes(q);
        if (!matchesQuery) return false;
      }

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

      if (selectedCategory !== 'all') {
        const targetCat = selectedCategory.toLowerCase();
        const modCat = mod.category?.toLowerCase();

        if (modCat) {
          if (modCat !== targetCat) return false;
        } else {
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

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {/* List Header (§4.1) */}
      <div className="list-header" style={{ height: '44px', display: 'flex', alignItems: 'center', padding: '0 var(--space-5)', borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="stats" style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px', color: 'var(--text-3)' }}>
          <span><b style={{ color: 'var(--text-1)' }}>{enabledCount}</b> enabled</span>
          <span style={{ width: '1px', height: '16px', background: 'var(--border-subtle)' }}></span>
          <span>
            <b style={{ color: needsAttentionCount > 0 ? 'var(--warn)' : 'var(--text-1)' }}>
              {needsAttentionCount}
            </b>{' '}needs attention
          </span>
          <span style={{ width: '1px', height: '16px', background: 'var(--border-subtle)' }}></span>
          <span className="mono">{formatBytes(totalBytes)} on disk</span>
        </div>

        <div className="actions" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Button variant="ghost" size="sm" onClick={handleEnableAll}>Enable all</Button>
          <span style={{ color: 'var(--border-subtle)' }}>|</span>
          <Button variant="ghost" size="sm" onClick={handleDisableAll}>Disable all</Button>
          
          <Select
            value={sortBy}
            onChange={onSortByChange}
            options={['Load order', 'Name', 'Recently updated', 'Size']}
            aria-label="Sort mods"
          />
          
          <IconButton
            icon="refresh"
            onClick={onRefresh}
            tooltip="Refresh"
            aria-label="Refresh mods list"
            size="sm"
            disabled={loading}
          />
        </div>
      </div>

      {/* Content Area */}
      <div className="content-row" style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        {/* Mod List */}
        <div 
          className="mod-list" 
          id="modList"
          style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: '4px' }}
          role="listbox"
          aria-label="Installed mods"
        >
          {mods.length === 0 ? (
            <EmptyState
              icon="package"
              title="No mods installed"
              hint="Browse the catalog to add mods"
              actionLabel="Browse catalog"
              onAction={onGoToOnline}
            />
          ) : sortedMods.length === 0 ? (
            <EmptyState
              icon="filter"
              title="No matching mods"
              hint="Try adjusting your filters"
            />
          ) : (
            sortedMods.map((mod) => (
              <ModRow
                key={mod.name}
                mod={mod}
                isInstalled={true}
                isSelected={selectedModName?.toLowerCase() === mod.name.toLowerCase()}
                hasUpdate={mod.hasUpdate}
                hasIssues={mod.depCheck.hasIssues}
                onSelect={() => onSelectMod(selectedModName?.toLowerCase() === mod.name.toLowerCase() ? null : mod.name)}
                onToggle={(enabled) => onToggleMod(mod.name, enabled)}
              />
            ))
          )}
        </div>

        {/* Detail Rail */}
        <DetailRail
          mod={selectedMod}
          isOpen={!!selectedMod}
          onClose={() => onSelectMod(null)}
          onToggleMod={onToggleMod}
          onUninstallMod={onUninstallMod}
          onUpdateMod={onUpdateMod}
          onInstallMissingDep={onInstallMissingDep}
          onOpenChangelog={onOpenChangelog}
          mods={mods}
        />
      </div>
    </div>
  );
};
