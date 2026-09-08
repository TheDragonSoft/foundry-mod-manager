import React, { useState, useEffect } from 'react';
import { X, Download, ExternalLink, Calendar, User, Star, ArrowDownToLine, Loader2, CheckCircle, AlertTriangle, ShieldAlert } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ModItem, ModRelease, ParsedDependency } from '../types';
import { api } from '../services/api';
import { getThumbnailUrl } from '../utils/helpers';

interface ModDetailsModalProps {
  modName: string;
  onClose: () => void;
  onInstall: (name: string, version?: string) => void;
  isInstalled: boolean;
  installedVersion?: string;
  installing: boolean;
}

export const ModDetailsModal: React.FC<ModDetailsModalProps> = ({
  modName,
  onClose,
  onInstall,
  isInstalled,
  installedVersion,
  installing,
}) => {
  const [details, setDetails] = useState<ModItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVersion, setSelectedVersion] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'description' | 'changelog' | 'dependencies'>('description');
  const [parsedDeps, setParsedDeps] = useState<{
    required: ParsedDependency[];
    optional: ParsedDependency[];
    incompatible: ParsedDependency[];
  }>({ required: [], optional: [], incompatible: [] });

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    api.getModDetails(modName)
      .then((data) => {
        if (!mounted) return;
        setDetails(data);
        const releases = data.releases || (data.latest_release ? [data.latest_release] : []);
        if (releases.length > 0) {
          const latest = releases[releases.length - 1];
          setSelectedVersion(latest.version);
          updateDependencies(latest);
        }
      })
      .catch((err) => {
        console.error('Failed to load mod details:', err);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [modName]);

  const updateDependencies = (release: ModRelease) => {
    const rawDeps = release.info_json?.dependencies || [];
    const required: ParsedDependency[] = [];
    const optional: ParsedDependency[] = [];
    const incompatible: ParsedDependency[] = [];

    const regex = /^((?:)|(?:\?)|(?:\(\?\))|(?:!)|(?:~))(?:\s*)([a-zA-Z0-9_-]+)(?:\s*)((?:>=|<=|==|=|>|<)?)(?:\s*)([0-9]+(?:\.[0-9]+)*)?$/i;

    for (const depStr of rawDeps) {
      const match = depStr.trim().match(regex);
      const prefix = match ? match[1] : '';
      const id = match ? match[2] : depStr;
      const ineq = match ? (match[3] === '==' ? '=' : match[3] || '') : '';
      const version = match ? match[4] || '' : '';

      const item: ParsedDependency = {
        id,
        type: prefix === '!' ? 'incompatible' : (prefix === '?' || prefix === '(?)') ? 'optional' : 'required',
        ineq,
        version,
        raw: depStr,
      };

      if (item.type === 'incompatible') incompatible.push(item);
      else if (item.type === 'optional') optional.push(item);
      else required.push(item);
    }

    setParsedDeps({ required, optional, incompatible });
  };

  const handleVersionChange = (version: string) => {
    setSelectedVersion(version);
    const releases = details?.releases || [];
    const match = releases.find(r => r.version === version);
    if (match) {
      updateDependencies(match);
    }
  };

  const releases = details?.releases || (details?.latest_release ? [details.latest_release] : []);

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-factorio-sidebar border border-factorio-border w-full max-w-4xl h-[85vh] rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-factorio-border flex items-start justify-between bg-factorio-card/70 shrink-0">
          <div className="flex items-start space-x-4">
            {details?.thumbnail ? (
              <img
                src={getThumbnailUrl(details.thumbnail)}
                alt={details.title}
                className="w-16 h-16 rounded-lg object-cover border border-factorio-border shadow-md shrink-0 bg-factorio-bg"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="w-16 h-16 rounded-lg bg-factorio-bg border border-factorio-border flex items-center justify-center text-orange-500 font-bold text-xl shrink-0">
                ⚙
              </div>
            )}

            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-bold text-factorio-text">{details?.title || modName}</h2>
                <span className="text-xs bg-factorio-bg px-2 py-0.5 rounded text-factorio-textMuted font-mono">
                  {modName}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-factorio-textMuted mt-1">
                <span className="flex items-center gap-1">
                  <User className="w-3.5 h-3.5" />
                  {details?.owner || 'Unknown'}
                </span>
                <span className="flex items-center gap-1">
                  <ArrowDownToLine className="w-3.5 h-3.5" />
                  {details?.downloads_count?.toLocaleString() || 0} downloads
                </span>
                {details?.score !== undefined && (
                  <span className="flex items-center gap-1 text-amber-400">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    {details.score.toFixed(1)}
                  </span>
                )}
                <a
                  href={`https://mods.factorio.com/mod/${modName}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-orange-400 hover:text-orange-300 hover:underline"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Factorio Portal
                </a>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Version Select & Install Button */}
            <div className="flex items-center space-x-2 bg-factorio-bg p-1 rounded-lg border border-factorio-border">
              <select
                value={selectedVersion}
                onChange={(e) => handleVersionChange(e.target.value)}
                className="bg-transparent text-xs text-factorio-text px-2 py-1 focus:outline-none cursor-pointer"
                disabled={installing || loading}
              >
                {releases.slice().reverse().map((r) => (
                  <option key={r.version} value={r.version} className="bg-factorio-card text-factorio-text">
                    v{r.version} {r.info_json?.factorio_version ? `(${r.info_json.factorio_version})` : ''}
                  </option>
                ))}
              </select>

              <button
                onClick={() => onInstall(modName, selectedVersion)}
                disabled={installing || loading}
                className="factorio-btn-primary text-xs py-1.5 px-3 flex items-center space-x-1 cursor-pointer disabled:opacity-50"
              >
                {installing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Installing...</span>
                  </>
                ) : isInstalled && installedVersion === selectedVersion ? (
                  <>
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-300" />
                    <span>Reinstall</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    <span>Install v{selectedVersion || 'Latest'}</span>
                  </>
                )}
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-factorio-textMuted hover:text-factorio-text hover:bg-factorio-card transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-factorio-border px-4 bg-factorio-bg/50 shrink-0">
          <button
            onClick={() => setActiveTab('description')}
            className={`py-2.5 px-4 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'description'
                ? 'border-orange-500 text-orange-400'
                : 'border-transparent text-factorio-textMuted hover:text-factorio-text'
            }`}
          >
            Description
          </button>
          <button
            onClick={() => setActiveTab('dependencies')}
            className={`py-2.5 px-4 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'dependencies'
                ? 'border-orange-500 text-orange-400'
                : 'border-transparent text-factorio-textMuted hover:text-factorio-text'
            }`}
          >
            <span>Dependencies</span>
            {parsedDeps.required.length > 0 && (
              <span className="text-[10px] bg-orange-500/20 text-orange-300 px-1.5 py-0.2 rounded-full">
                {parsedDeps.required.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('changelog')}
            className={`py-2.5 px-4 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'changelog'
                ? 'border-orange-500 text-orange-400'
                : 'border-transparent text-factorio-textMuted hover:text-factorio-text'
            }`}
          >
            Changelog
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-factorio-bg/30">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center text-factorio-textMuted space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-orange-400" />
              <p className="text-sm">Fetching mod details from portal...</p>
            </div>
          ) : (
            <>
              {activeTab === 'description' && (
                <div className="prose prose-invert max-w-none text-factorio-text text-sm leading-relaxed">
                  {details?.description ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {details.description}
                    </ReactMarkdown>
                  ) : (
                    <p className="text-factorio-textMuted italic">{details?.summary || 'No description provided.'}</p>
                  )}
                </div>
              )}

              {activeTab === 'dependencies' && (
                <div className="space-y-6">
                  {/* Required */}
                  <div>
                    <h3 className="text-sm font-bold text-orange-400 mb-2 flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4 text-orange-400" />
                      Required Dependencies ({parsedDeps.required.length})
                    </h3>
                    {parsedDeps.required.length === 0 ? (
                      <p className="text-xs text-factorio-textMuted">No external dependencies required.</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {parsedDeps.required.map((dep, idx) => (
                          <div
                            key={idx}
                            className="bg-factorio-card p-2.5 rounded border border-factorio-border flex items-center justify-between text-xs"
                          >
                            <div>
                              <span className="font-semibold text-factorio-text">{dep.id}</span>
                              {dep.version && (
                                <span className="text-factorio-textMuted ml-1.5 font-mono">
                                  {dep.ineq} {dep.version}
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] bg-orange-500/20 text-orange-300 px-2 py-0.5 rounded font-medium">
                              Auto-downloaded
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Optional */}
                  {parsedDeps.optional.length > 0 && (
                    <div>
                      <h3 className="text-sm font-bold text-blue-400 mb-2 flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-blue-400" />
                        Optional Dependencies ({parsedDeps.optional.length})
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {parsedDeps.optional.map((dep, idx) => (
                          <div
                            key={idx}
                            className="bg-factorio-card p-2.5 rounded border border-factorio-border flex items-center justify-between text-xs"
                          >
                            <span className="font-semibold text-factorio-text">{dep.id}</span>
                            <span className="text-[11px] text-factorio-textMuted">Optional</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Incompatible */}
                  {parsedDeps.incompatible.length > 0 && (
                    <div>
                      <h3 className="text-sm font-bold text-red-400 mb-2 flex items-center gap-1.5">
                        <ShieldAlert className="w-4 h-4 text-red-400" />
                        Incompatible Mods ({parsedDeps.incompatible.length})
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {parsedDeps.incompatible.map((dep, idx) => (
                          <div
                            key={idx}
                            className="bg-red-950/40 p-2.5 rounded border border-red-800/60 flex items-center justify-between text-xs text-red-300"
                          >
                            <span className="font-semibold">{dep.id}</span>
                            <span className="text-[11px] text-red-400 font-medium">Conflict</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'changelog' && (
                <div className="bg-factorio-card p-4 rounded-lg border border-factorio-border overflow-x-auto">
                  {details?.changelog ? (
                    <pre className="text-xs font-mono text-factorio-text leading-relaxed whitespace-pre-wrap">
                      {details.changelog}
                    </pre>
                  ) : (
                    <p className="text-xs text-factorio-textMuted italic">No changelog available.</p>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
