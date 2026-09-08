import React, { useMemo } from 'react';
import { InstalledMod, ParsedDependency } from '../../types';
import { checkModDependencies } from '../../utils/helpers';
import { SectionHeader } from '../../primitives/SectionHeader';
import { Badge } from '../../primitives/Badge';
import { Button } from '../../primitives/Button';

interface DependenciesViewProps {
  mods: InstalledMod[];
  onInstallMod: (name: string, version?: string) => void;
  onShowToast: (message: string, type?: 'info' | 'success' | 'error') => void;
}

export const DependenciesView: React.FC<DependenciesViewProps> = ({
  mods,
  onInstallMod,
  onShowToast,
}) => {
  // Compute dependency results for every mod
  const analysis = useMemo(() => {
    const missingMap = new Map<string, { dep: ParsedDependency; requestedBy: string[] }>();
    const incompatibleList: { modName: string; conflictWith: string }[] = [];
    let totalDepsCount = 0;

    mods.forEach((mod) => {
      const res = checkModDependencies(mod, mods);
      totalDepsCount += (mod.dependencies || []).length;

      res.missing.forEach((dep) => {
        const key = dep.id.toLowerCase();
        const existing = missingMap.get(key);
        if (existing) {
          if (!existing.requestedBy.includes(mod.title)) {
            existing.requestedBy.push(mod.title);
          }
        } else {
          missingMap.set(key, { dep, requestedBy: [mod.title] });
        }
      });

      res.incompatible.forEach((dep) => {
        incompatibleList.push({ modName: mod.title, conflictWith: dep.id });
      });
    });

    return {
      missingList: Array.from(missingMap.values()),
      incompatibleList,
      totalDepsCount,
      isHealthy: missingMap.size === 0 && incompatibleList.length === 0,
    };
  }, [mods]);

  const handleFetchAllMissing = () => {
    analysis.missingList.forEach(({ dep }) => {
      onInstallMod(dep.id, dep.version || undefined);
    });
    onShowToast(`Downloading ${analysis.missingList.length} missing dependencies…`, 'info');
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 w-full">
      {/* Header with inline status */}
      <SectionHeader
        overline="INSTALLED MODS & REQUIREMENTS"
        title="Dependency health & load order"
        description="Factorio requires all non-optional dependencies to be present in the active profile before the engine can initialize."
        status={
          <Badge tone={analysis.isHealthy ? 'success' : 'danger'} variant="subtle">
            {analysis.isHealthy ? 'All dependencies satisfied' : 'Action required'}
          </Badge>
        }
        className="mb-8"
      />

      {/* Missing Dependencies Alert Banner */}
      {analysis.missingList.length > 0 && (
        <div
          className="mb-6 p-4 rounded-lg border"
          style={{ background: 'var(--warn-subtle)', borderColor: 'var(--warn)' }}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <b style={{ color: 'var(--text-1)' }}>
                {analysis.missingList.length} missing required dependencies detected:
              </b>
              <ul className="mt-2 space-y-1 text-xs list-disc list-inside">
                {analysis.missingList.map(({ dep, requestedBy }) => (
                  <li key={dep.id} style={{ color: 'var(--text-2)' }}>
                    <span className="font-semibold mono">{dep.id}</span>{' '}
                    <span className="mono">{dep.ineq} {dep.version}</span>{' '}
                    <span style={{ color: 'var(--text-3)' }}>
                      (required by {requestedBy.join(', ')})
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <Button variant="secondary" size="sm" onClick={handleFetchAllMissing}>
              Fetch all missing ({analysis.missingList.length})
            </Button>
          </div>
        </div>
      )}

      {/* Incompatible Alert */}
      {analysis.incompatibleList.length > 0 && (
        <div
          className="mb-6 p-4 rounded-lg border"
          style={{ background: 'var(--danger-subtle)', borderColor: 'var(--danger)' }}
        >
          <b style={{ color: 'var(--text-1)' }}>Incompatible mod conflicts:</b>
          <ul className="mt-2 space-y-1 text-xs list-disc list-inside">
            {analysis.incompatibleList.map((item, idx) => (
              <li key={idx} style={{ color: 'var(--text-2)' }}>
                <b className="mono">{item.modName}</b> conflicts with{' '}
                <b className="mono">{item.conflictWith}</b>. Disable one of them.
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* All Installed Mods & Their Dependencies - Table-like card */}
      <div
        className="rounded-lg border overflow-hidden"
        style={{ background: 'var(--bg-panel)', borderColor: 'var(--border-subtle)' }}
      >
        {/* Header Row */}
        <div
          className="grid grid-cols-[40px_1fr_150px_120px_80px] gap-3 px-4 py-2 border-b text-[11px] font-semibold uppercase tracking-wider"
          style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-3)' }}
        >
          <div>#</div>
          <div>MOD</div>
          <div>VERSION</div>
          <div>REQUIRES</div>
          <div>STATUS</div>
        </div>

        {/* Mod Rows */}
        {mods.length === 0 ? (
          <div className="p-8 text-center" style={{ color: 'var(--text-3)' }}>
            No mods currently installed in this profile.
          </div>
        ) : (
          mods.map((mod, index) => {
            const hasDeps = mod.dependencies && mod.dependencies.length > 0;
            const res = checkModDependencies(mod, mods);

            return (
              <div
                key={mod.name}
                className="grid grid-cols-[40px_1fr_150px_120px_80px] gap-3 px-4 py-3 border-b last:border-b-0 items-center"
                style={{ borderColor: 'var(--border-subtle)' }}
              >
                {/* Load Order Index */}
                <div className="mono text-xs" style={{ color: 'var(--text-3)' }}>
                  {index + 1}.
                </div>

                {/* Mod Name */}
                <div className="font-semibold text-sm truncate" style={{ color: 'var(--text-1)' }}>
                  {mod.title}
                </div>

                {/* Version */}
                <div className="mono text-xs" style={{ color: 'var(--text-2)' }}>
                  v{mod.version}
                </div>

                {/* Dependencies */}
                <div className="space-y-1">
                  {hasDeps ? (
                    mod.dependencies.slice(0, 2).map((dep) => (
                      <div key={dep.raw} className="text-xs">
                        <span className="mono" style={{ color: 'var(--text-2)' }}>
                          {dep.id}
                        </span>
                        {dep.ineq && dep.version && (
                          <span className="mono" style={{ color: 'var(--text-3)' }}>
                            {' '}{dep.ineq}{dep.version}
                          </span>
                        )}
                      </div>
                    ))
                  ) : (
                    <span className="text-xs" style={{ color: 'var(--text-3)' }}>
                      —
                    </span>
                  )}
                  {hasDeps && mod.dependencies.length > 2 && (
                    <div className="text-[10px]" style={{ color: 'var(--text-3)' }}>
                      +{mod.dependencies.length - 2} more
                    </div>
                  )}
                </div>

                {/* Status */}
                <div>
                  {res.hasIssues ? (
                    <Badge tone="danger" variant="subtle">Issues</Badge>
                  ) : hasDeps ? (
                    <Badge tone="success" variant="subtle">Verified</Badge>
                  ) : (
                    <Badge tone="neutral" variant="subtle">Standalone</Badge>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
