import React, { useState } from 'react';
import { ModProfile } from '../../types';
import { api } from '../../services/api';
import { SectionHeader } from '../../primitives/SectionHeader';
import { Badge } from '../../primitives/Badge';
import { Button } from '../../primitives/Button';
import { Input } from '../../primitives/Input';

interface ProfilesViewProps {
  profiles: ModProfile[];
  activeProfileId: string;
  onSelectProfile: (id: string) => void;
  onRefreshProfiles: () => void;
  onShowToast: (message: string, type?: 'info' | 'success' | 'error') => void;
}

export const ProfilesView: React.FC<ProfilesViewProps> = ({
  profiles,
  activeProfileId,
  onSelectProfile,
  onRefreshProfiles,
  onShowToast,
}) => {
  const [newProfileName, setNewProfileName] = useState('');
  const [newProfileDesc, setNewProfileDesc] = useState('');
  const [importCode, setImportCode] = useState('');
  const [importName, setImportName] = useState('');
  const [importing, setImporting] = useState(false);
  const [exportModalCode, setExportModalCode] = useState<{ profileName: string; code: string } | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProfileName.trim()) return;

    try {
      const created = await api.createProfile(newProfileName.trim(), newProfileDesc.trim());
      setNewProfileName('');
      setNewProfileDesc('');
      onRefreshProfiles();
      onSelectProfile(created.id);
      onShowToast(`Created profile "${created.name}"`, 'success');
    } catch (err: any) {
      onShowToast(`Failed to create profile: ${err.message}`, 'error');
    }
  };

  const handleDuplicate = async (id: string, name: string) => {
    try {
      const duplicated = await api.duplicateProfile(id, `${name} (Copy)`);
      onRefreshProfiles();
      onShowToast(`Duplicated as "${duplicated.name}"`, 'success');
    } catch (err: any) {
      onShowToast(`Failed to duplicate: ${err.message}`, 'error');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (profiles.length <= 1) {
      onShowToast('Cannot delete the only profile.', 'error');
      return;
    }
    if (!window.confirm(`Are you sure you want to delete profile "${name}"?`)) return;

    try {
      await api.deleteProfile(id);
      onRefreshProfiles();
      onShowToast(`Deleted profile "${name}"`, 'info');
    } catch (err: any) {
      onShowToast(`Failed to delete profile: ${err.message}`, 'error');
    }
  };

  const handleExport = async (id: string, name: string) => {
    try {
      const res = await api.exportProfileCode(id);
      setExportModalCode({ profileName: name, code: res.code });
      await navigator.clipboard.writeText(res.code);
      onShowToast(`Copied share code for "${name}" to clipboard!`, 'success');
    } catch (err: any) {
      onShowToast(`Failed to export: ${err.message}`, 'error');
    }
  };

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importCode.trim()) return;
    setImporting(true);

    try {
      const res = await api.importProfileCode(importCode.trim(), importName.trim() || undefined);
      setImportCode('');
      setImportName('');
      onRefreshProfiles();
      onSelectProfile(res.profile.id);
      onShowToast(`Imported profile "${res.profile.name}" successfully!`, 'success');
    } catch (err: any) {
      onShowToast(`Failed to import profile: ${err.message}`, 'error');
    } finally {
      setImporting(false);
    }
  };

  const activeProfile = profiles.find((p) => p.id === activeProfileId);

  return (
    <div className="flex-1 overflow-y-auto p-6 w-full">
      {/* Header */}
      <SectionHeader
        overline="PROFILES"
        title="Profile management"
        description="Each profile maintains an isolated directory of mod archives and active states, allowing seamless switching between modpacks."
        className="mb-8"
      />

      {/* Active Profile Card */}
      {activeProfile && (
        <div
          className="p-4 rounded-lg border mb-8 flex items-center justify-between gap-4 transition-colors"
          style={{ background: 'var(--bg-panel)', borderColor: 'var(--border-subtle)' }}
        >
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div
              className="w-2.5 h-2.5 rounded-full flex-none"
              style={{ background: 'var(--success)', boxShadow: '0 0 0 3px var(--success-subtle)' }}
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm" style={{ color: 'var(--text-1)' }}>
                  {activeProfile.name}
                </span>
                <Badge tone="accent" variant="outline">Active</Badge>
              </div>
              {activeProfile.description && (
                <p className="text-xs truncate mt-0.5" style={{ color: 'var(--text-2)' }}>
                  {activeProfile.description}
                </p>
              )}
              <div className="mono text-[11px] mt-1" style={{ color: 'var(--text-3)' }}>
                {activeProfile.enabledCount} enabled / {activeProfile.modsCount} total mods
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-none">
            <Button variant="secondary" size="sm" onClick={() => handleDuplicate(activeProfile.id, activeProfile.name)}>
              Duplicate
            </Button>
            <Button variant="secondary" size="sm" onClick={() => handleExport(activeProfile.id, activeProfile.name)}>
              Export code
            </Button>
          </div>
        </div>
      )}

      {/* Export Code Box */}
      {exportModalCode && (
        <div
          className="mb-8 p-4 rounded-lg border"
          style={{ background: 'var(--bg-panel)', borderColor: 'var(--border-strong)' }}
        >
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-xs" style={{ color: 'var(--accent)' }}>
              Share code for "{exportModalCode.profileName}"
            </h4>
            <button
              className="text-xs hover:underline"
              style={{ color: 'var(--text-3)' }}
              onClick={() => setExportModalCode(null)}
            >
              Dismiss
            </button>
          </div>
          <div className="search mb-2">
            <input
              readOnly
              value={exportModalCode.code}
              onClick={(e) => (e.target as HTMLInputElement).select()}
              className="mono text-xs"
            />
          </div>
          <p className="text-[11px]" style={{ color: 'var(--text-3)' }}>
            Code is copied to your clipboard. Send this to friends to let them import the identical mod list and versions!
          </p>
        </div>
      )}

      {/* Two columns: Create profile & Import code */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Create Profile */}
        <form
          onSubmit={handleCreate}
          className="p-4 rounded-lg border flex flex-col justify-between"
          style={{ background: 'var(--bg-panel)', borderColor: 'var(--border-subtle)' }}
        >
          <div>
            <h4 className="font-semibold text-sm mb-1" style={{ color: 'var(--text-1)' }}>
              Create new profile
            </h4>
            <p className="text-xs mb-3" style={{ color: 'var(--text-2)' }}>
              Start an empty profile with default base factorio packages.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold mb-1" style={{ color: 'var(--text-2)' }}>
                  Profile name
                </label>
                <Input
                  placeholder="e.g. Space Age Ultracube"
                  value={newProfileName}
                  onChange={(e) => setNewProfileName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold mb-1" style={{ color: 'var(--text-2)' }}>
                  Description (optional)
                </label>
                <Input
                  placeholder="e.g. Multiplayer session with friends"
                  value={newProfileDesc}
                  onChange={(e) => setNewProfileDesc(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t flex justify-end" style={{ borderColor: 'var(--border-subtle)' }}>
            <Button type="submit" disabled={!newProfileName.trim()}>
              Create profile
            </Button>
          </div>
        </form>

        {/* Import Share Code */}
        <form
          onSubmit={handleImport}
          className="p-4 rounded-lg border flex flex-col justify-between"
          style={{ background: 'var(--bg-panel)', borderColor: 'var(--border-subtle)' }}
        >
          <div>
            <h4 className="font-semibold text-sm mb-1" style={{ color: 'var(--text-1)' }}>
              Import share code
            </h4>
            <p className="text-xs mb-3" style={{ color: 'var(--text-2)' }}>
              Paste a shared profile code from another player to clone their mod setup.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold mb-1" style={{ color: 'var(--text-2)' }}>
                  Share code string
                </label>
                <Input
                  placeholder="Paste base64 share code here…"
                  value={importCode}
                  onChange={(e) => setImportCode(e.target.value)}
                  className="mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold mb-1" style={{ color: 'var(--text-2)' }}>
                  Custom profile name (optional)
                </label>
                <Input
                  placeholder="Leave empty to use shared name"
                  value={importName}
                  onChange={(e) => setImportName(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t flex justify-end" style={{ borderColor: 'var(--border-subtle)' }}>
            <Button type="submit" disabled={!importCode.trim() || importing}>
              {importing ? 'Importing & downloading…' : 'Import profile'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
