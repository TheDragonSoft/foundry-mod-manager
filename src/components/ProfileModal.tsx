import React, { useState } from 'react';
import { X, Plus, Copy, Check, Download, Trash2, Layers, Share2, FileInput } from 'lucide-react';
import { ModProfile } from '../types';
import { api } from '../services/api';
import { ConfirmModal } from './ConfirmModal';

interface ProfileModalProps {
  profiles: ModProfile[];
  activeProfileId: string;
  onClose: () => void;
  onSelectProfile: (id: string) => void;
  onRefreshProfiles: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  profiles,
  activeProfileId,
  onClose,
  onSelectProfile,
  onRefreshProfiles,
}) => {
  const [activeTab, setActiveTab] = useState<'manage' | 'export' | 'import'>('manage');
  const [newProfileName, setNewProfileName] = useState('');
  const [newProfileDesc, setNewProfileDesc] = useState('');
  const [exportCode, setExportCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [importCode, setImportCode] = useState('');
  const [importName, setImportName] = useState('');
  const [importing, setImporting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [profileToDelete, setProfileToDelete] = useState<{ id: string; name: string } | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProfileName.trim()) return;

    try {
      const created = await api.createProfile(newProfileName.trim(), newProfileDesc.trim());
      setNewProfileName('');
      setNewProfileDesc('');
      onRefreshProfiles();
      onSelectProfile(created.id);
      setSuccessMsg(`Profile "${created.name}" created!`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create profile');
    }
  };

  const handleDuplicate = async (id: string, name: string) => {
    try {
      const duplicated = await api.duplicateProfile(id, `${name} (Copy)`);
      onRefreshProfiles();
      setSuccessMsg(`Profile duplicated as "${duplicated.name}"!`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to duplicate profile');
    }
  };

  const handleDelete = (id: string, name: string) => {
    if (profiles.length <= 1) {
      setErrorMsg('Cannot delete the only profile.');
      return;
    }
    setProfileToDelete({ id, name });
  };

  const executeDelete = async () => {
    if (!profileToDelete) return;
    const { id, name } = profileToDelete;
    setProfileToDelete(null);

    try {
      await api.deleteProfile(id);
      onRefreshProfiles();
      setSuccessMsg(`Profile "${name}" deleted.`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to delete profile');
    }
  };

  const loadExportCode = async (id: string) => {
    try {
      const res = await api.exportProfileCode(id);
      setExportCode(res.code);
      setActiveTab('export');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to export profile');
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(exportCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importCode.trim()) return;

    setImporting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const result = await api.importProfileCode(importCode.trim(), importName.trim() || undefined);
      onRefreshProfiles();
      onSelectProfile(result.profile.id);
      setImportCode('');
      setImportName('');
      setSuccessMsg(`Profile "${result.profile.name}" imported successfully! Downloads queued.`);
      setActiveTab('manage');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to import profile');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-factorio-sidebar border border-factorio-border w-full max-w-2xl rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-factorio-border flex items-center justify-between bg-factorio-card/70">
          <div className="flex items-center space-x-2">
            <Layers className="w-5 h-5 text-orange-400" />
            <h2 className="text-lg font-bold text-factorio-text">Profile Manager</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-factorio-textMuted hover:text-factorio-text hover:bg-factorio-card transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-factorio-border px-4 bg-factorio-bg/50 shrink-0">
          <button
            onClick={() => setActiveTab('manage')}
            className={`py-2.5 px-4 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'manage'
                ? 'border-orange-500 text-orange-400'
                : 'border-transparent text-factorio-textMuted hover:text-factorio-text'
            }`}
          >
            Manage Profiles
          </button>
          <button
            onClick={() => {
              loadExportCode(activeProfileId);
              setActiveTab('export');
            }}
            className={`py-2.5 px-4 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center space-x-1 ${
              activeTab === 'export'
                ? 'border-orange-500 text-orange-400'
                : 'border-transparent text-factorio-textMuted hover:text-factorio-text'
            }`}
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Export Code</span>
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`py-2.5 px-4 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center space-x-1 ${
              activeTab === 'import'
                ? 'border-orange-500 text-orange-400'
                : 'border-transparent text-factorio-textMuted hover:text-factorio-text'
            }`}
          >
            <FileInput className="w-3.5 h-3.5" />
            <span>Import Profile</span>
          </button>
        </div>

        {/* Alerts */}
        {errorMsg && (
          <div className="p-3 bg-red-950/60 border-b border-red-800/80 text-xs text-red-300">
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="p-3 bg-emerald-950/60 border-b border-emerald-800/80 text-xs text-emerald-300">
            {successMsg}
          </div>
        )}

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh] bg-factorio-bg/30">
          {activeTab === 'manage' && (
            <div className="space-y-6">
              {/* Existing Profiles List */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-factorio-textMuted uppercase tracking-wider">
                  Available Profiles ({profiles.length})
                </h3>
                <div className="space-y-2">
                  {profiles.map((p) => {
                    const isActive = p.id === activeProfileId;
                    return (
                      <div
                        key={p.id}
                        className={`p-3 rounded-lg border flex items-center justify-between transition-all ${
                          isActive
                            ? 'bg-orange-500/10 border-orange-500/40 text-factorio-text'
                            : 'bg-factorio-card border-factorio-border text-factorio-text hover:border-factorio-borderLight'
                        }`}
                      >
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-sm">{p.name}</span>
                            {isActive && (
                              <span className="text-[10px] bg-orange-500/20 text-orange-400 font-bold px-1.5 py-0.5 rounded uppercase">
                                Active
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-factorio-textMuted mt-0.5">
                            {p.description || 'No description'} •{' '}
                            <span className="font-medium text-factorio-text">
                              {p.enabledCount || 0} active
                            </span>{' '}
                            / {p.modsCount || 0} installed
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          {!isActive && (
                            <button
                              onClick={() => {
                                onSelectProfile(p.id);
                                setSuccessMsg(`Switched to "${p.name}"`);
                              }}
                              className="px-2.5 py-1 bg-factorio-bg hover:bg-factorio-cardHover border border-factorio-border rounded text-xs font-semibold text-factorio-text transition-all cursor-pointer"
                            >
                              Select
                            </button>
                          )}
                          <button
                            onClick={() => loadExportCode(p.id)}
                            className="p-1.5 hover:bg-factorio-bg rounded text-factorio-textMuted hover:text-orange-400 transition-colors cursor-pointer"
                            title="Export Profile Code"
                          >
                            <Share2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDuplicate(p.id, p.name)}
                            className="p-1.5 hover:bg-factorio-bg rounded text-factorio-textMuted hover:text-factorio-text transition-colors cursor-pointer"
                            title="Duplicate Profile"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          {profiles.length > 1 && (
                            <button
                              onClick={() => handleDelete(p.id, p.name)}
                              className="p-1.5 hover:bg-factorio-bg rounded text-factorio-textMuted hover:text-red-400 transition-colors cursor-pointer"
                              title="Delete Profile"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Create Profile Form */}
              <form onSubmit={handleCreate} className="bg-factorio-card p-4 rounded-lg border border-factorio-border space-y-3">
                <h3 className="text-xs font-bold text-factorio-textMuted uppercase tracking-wider flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-orange-400" />
                  Create New Profile
                </h3>
                <div className="grid grid-cols-1 gap-2">
                  <input
                    type="text"
                    placeholder="Profile Name (e.g. Space Age Vanilla+)"
                    value={newProfileName}
                    onChange={(e) => setNewProfileName(e.target.value)}
                    className="bg-factorio-bg border border-factorio-border rounded px-3 py-2 text-xs text-factorio-text focus:outline-none focus:border-orange-500"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Optional Description"
                    value={newProfileDesc}
                    onChange={(e) => setNewProfileDesc(e.target.value)}
                    className="bg-factorio-bg border border-factorio-border rounded px-3 py-2 text-xs text-factorio-text focus:outline-none focus:border-orange-500"
                  />
                </div>
                <button
                  type="submit"
                  className="factorio-btn-primary text-xs py-2 px-4 flex items-center space-x-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Profile</span>
                </button>
              </form>
            </div>
          )}

          {activeTab === 'export' && (
            <div className="space-y-4">
              <p className="text-xs text-factorio-textMuted leading-relaxed">
                Copy this shareable profile code. Anyone with this code can paste it into their Factorio Mod Manager to automatically download and configure the exact same mods and versions.
              </p>
              <div className="relative">
                <textarea
                  readOnly
                  value={exportCode}
                  rows={6}
                  className="w-full bg-factorio-bg border border-factorio-border rounded-lg p-3 text-xs font-mono text-orange-300 focus:outline-none select-all break-all"
                />
                <button
                  onClick={handleCopyCode}
                  className="absolute top-3 right-3 bg-factorio-card hover:bg-factorio-cardHover border border-factorio-border text-factorio-text py-1.5 px-3 rounded text-xs flex items-center space-x-1.5 shadow-md cursor-pointer transition-all"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Code</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'import' && (
            <form onSubmit={handleImport} className="space-y-4">
              <p className="text-xs text-factorio-textMuted leading-relaxed">
                Paste a shared profile code below to create a new profile and download all its mods from the re146 mirror.
              </p>
              <textarea
                value={importCode}
                onChange={(e) => setImportCode(e.target.value)}
                placeholder="Paste base64 profile code here..."
                rows={5}
                className="w-full bg-factorio-bg border border-factorio-border rounded-lg p-3 text-xs font-mono text-factorio-text focus:outline-none focus:border-orange-500 break-all"
                required
              />
              <input
                type="text"
                value={importName}
                onChange={(e) => setImportName(e.target.value)}
                placeholder="Custom Profile Name (optional)"
                className="w-full bg-factorio-bg border border-factorio-border rounded px-3 py-2 text-xs text-factorio-text focus:outline-none focus:border-orange-500"
              />
              <button
                type="submit"
                disabled={importing}
                className="factorio-btn-primary text-xs py-2 px-4 flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{importing ? 'Importing & Downloading...' : 'Import Profile'}</span>
              </button>
            </form>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={!!profileToDelete}
        title="Delete Mod Profile"
        message={`Are you sure you want to delete profile "${profileToDelete?.name}"? All installed mods and configuration in this profile will be permanently removed.`}
        confirmText="Delete Profile"
        confirmVariant="danger"
        onConfirm={executeDelete}
        onCancel={() => setProfileToDelete(null)}
      />
    </div>
  );
};
