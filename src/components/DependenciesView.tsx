import React, { useMemo } from 'react';
import { InstalledMod, ParsedDependency } from '../types';
import { checkModDependencies } from '../utils/helpers';

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
    <div className="flex-1 overflow-y-auto p-6 max-w-4xl mx-auto w-full">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="slab text-xl font-semibold mb-1" style={{ color: 'var(--text)' }}>
            Dependency health &amp; load order
          </h2>
          <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
            Factorio requires all non-optional dependencies to be present in the active profile before the engine can initialize.
          </p>
        </div>

        <div
          className="px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-2"
          style={{
            background: analysis.isHealthy ? 'var(--good-bg)' : 'var(--bad-bg)',
            borderColor: analysis.isHealthy ? 'var(--good)' : 'rgba(193,90,63,0.35)',
            color: analysis.isHealthy ? 'var(--good)' : 'var(--bad)',
          }}
        >
          <span>{analysis.isHealthy ? '● All dependencies satisfied' : '▲ Action required'}</span>
        </div>
      </div>

      {/* Missing Dependencies Alert Banner */}
      {analysis.missingList.length > 0 && (
        <div className="dep-note mb-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <b>{analysis.missingList.length} missing required dependencies detected:</b>
              <ul className="mt-2 space-y-1 text-xs list-disc list-inside">
                {analysis.missingList.map(({ dep, requestedBy }) => (
                  <li key={dep.id}>
                    <span className="font-semibold">{dep.id}</span> {dep.ineq} {dep.version}{' '}
                    <span style={{ color: 'var(--text-dim)' }}>
                      (required by {requestedBy.join(', ')})
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <button className="fix shrink-0" onClick={handleFetchAllMissing}>
              Fetch all missing ({analysis.missingList.length})
            </button>
          </div>
        </div>
      )}

      {/* Incompatible Alert */}
      {analysis.incompatibleList.length > 0 && (
        <div className="dep-note mb-6">
          <b>Incompatible mod conflicts:</b>
          <ul className="mt-2 space-y-1 text-xs list-disc list-inside">
            {analysis.incompatibleList.map((item, idx) => (
              <li key={idx}>
                <b>{item.modName}</b> conflicts with <b>{item.conflictWith}</b>. Disable one of them.
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* All Installed Mods & Their Dependencies */}
      <div className="space-y-4">
        <h4 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>
          Installed Mods &amp; Requirements
        </h4>

        {mods.length === 0 ? (
          <div className="drawer-empty py-12">
            <p>No mods currently installed in this profile.</p>
          </div>
        ) : (
          mods.map((mod) => {
            const hasDeps = mod.dependencies && mod.dependencies.length > 0;
            const res = checkModDependencies(mod, mods);

            return (
              <div
                key={mod.name}
                className="p-4 rounded-lg border transition-colors"
                style={{
                  background: 'var(--panel)',
                  borderColor: res.hasIssues ? 'rgba(193,90,63,0.3)' : 'var(--line)',
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm" style={{ color: 'var(--text)' }}>
                      {mod.title}
                    </span>
                    <span className="mono text-xs" style={{ color: 'var(--text-faint)' }}>
                      v{mod.version}
                    </span>
                  </div>

                  <span
                    className="text-[11px] font-semibold"
                    style={{ color: res.hasIssues ? 'var(--bad)' : 'var(--good)' }}
                  >
                    {res.hasIssues ? 'Issues detected' : hasDeps ? 'Verified' : 'Standalone'}
                  </span>
                </div>

                {hasDeps ? (
                  <div className="space-y-1 mt-2">
                    {mod.dependencies.map((dep) => {
                      const isMissing = res.missing.some((m) => m.id === dep.id);
                      const isConflict = res.incompatible.some((m) => m.id === dep.id);
                      let statusClass = 'ok';
                      let statusText = `${dep.ineq} ${dep.version} ok`.trim();
                      if (!statusText || statusText === 'ok') statusText = 'ok';

                      if (isMissing) {
                        statusClass = 'missing';
                        statusText = 'missing';
                      } else if (isConflict) {
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
                    })}
                  </div>
                ) : (
                  <p className="text-xs" style={{ color: 'var(--text-faint)' }}>
                    No dependencies required.
                  </p>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
