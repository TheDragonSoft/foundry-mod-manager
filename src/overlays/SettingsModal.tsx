import React, { useState } from 'react';
import { AppSettings } from '../types';
import { api } from '../services/api';
import { Button } from '../primitives/Button';
import { Input } from '../primitives/Input';
import { Select } from '../primitives/Select';
import { Checkbox } from '../primitives/Checkbox';
import { IconButton } from '../primitives/IconButton';

interface SettingsModalProps {
  settings: AppSettings | null;
  onClose: () => void;
  onUpdateSettings: (settings: AppSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onClose,
  onUpdateSettings,
}) => {
  const [formData, setFormData] = useState<AppSettings>(
    settings || {
      factorioExePath: '',
      factorioWritePath: '',
      primaryMirror: 'https://mods-storage.re146.dev/',
      customLaunchArgs: '',
      autoCheckUpdates: true,
      concurrentDownloads: 3,
      closeOnLaunch: false,
    }
  );
  const [detecting, setDetecting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    try {
      const updated = await api.updateSettings(formData);
      onUpdateSettings(updated);
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        onClose();
      }, 1000);
    } catch (err: any) {
      console.error('Failed to save settings:', err);
      setErrorMessage(err.message || 'Failed to save settings');
    }
  };

  const handleAutoDetect = async () => {
    setDetecting(true);
    setErrorMessage(null);
    try {
      const res = await api.autoDetectPaths();
      setFormData((prev) => ({
        ...prev,
        factorioExePath: res.factorioExePath || prev.factorioExePath,
        factorioWritePath: res.factorioWritePath || prev.factorioWritePath,
      }));
    } catch (err: any) {
      console.error('Auto-detection error:', err);
      setErrorMessage(err.message || 'Auto-detection failed');
    } finally {
      setDetecting(false);
    }
  };

  const handleBrowseExe = async () => {
    try {
      const filePath = await api.openFileDialog({
        title: 'Select Factorio Executable (factorio.exe)',
        filters: [
          { name: 'Factorio Executable', extensions: ['exe'] },
          { name: 'All Files', extensions: ['*'] },
        ],
      });
      if (filePath) {
        setFormData((prev) => ({ ...prev, factorioExePath: filePath }));
      }
    } catch (err) {
      console.error('Failed to browse exe:', err);
    }
  };

  const handleBrowseWritePath = async () => {
    try {
      const dirPath = await api.openDirectoryDialog({
        title: 'Select Factorio Data/AppData Folder',
      });
      if (dirPath) {
        setFormData((prev) => ({ ...prev, factorioWritePath: dirPath }));
      }
    } catch (err) {
      console.error('Failed to browse data dir:', err);
    }
  };

  const mirrorOptions = [
    { value: 'https://mods-storage.re146.dev/', label: 're146 Cloudflare R2 mirror (Fast, no login required)' },
    { value: 'https://mods.factorio.com/', label: 'Official Factorio Mod Portal (Fallback)' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'var(--overlay)', backdropFilter: 'blur(var(--backdrop-blur))' }}>
      <div
        className="w-full max-w-[640px] rounded-lg border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        style={{ 
          background: 'var(--bg-raised)', 
          borderColor: 'var(--border-strong)',
          boxShadow: '0 12px 32px rgba(0,0,0,.45)'
        }}
      >
        {/* Header */}
        <div
          className="px-6 py-4 border-b flex items-center justify-between"
          style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-raised)' }}
        >
          <h2 className="text-base font-semibold" style={{ color: 'var(--text-1)' }}>
            Application settings
          </h2>
          <IconButton icon="close" onClick={onClose} aria-label="Close settings" />
        </div>

        {/* Content */}
        <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-6">
          {errorMessage && (
            <div
              className="p-3 rounded border text-sm"
              style={{ background: 'var(--danger-subtle)', borderColor: 'var(--danger)', color: 'var(--text-1)' }}
            >
              <b>Error:</b> {errorMessage}
            </div>
          )}

          {/* PATHS Section */}
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--text-3)' }}>
              PATHS
            </div>

            {/* Factorio Exe */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold" style={{ color: 'var(--text-2)' }}>
                  Factorio executable (factorio.exe)
                </label>
                <button
                  type="button"
                  onClick={handleAutoDetect}
                  disabled={detecting}
                  className="text-xs hover:underline cursor-pointer"
                  style={{ color: 'var(--accent)' }}
                >
                  {detecting ? 'Detecting…' : 'Auto-detect'}
                </button>
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g. C:\\Games\\Factorio\\bin\\x64\\factorio.exe"
                  value={formData.factorioExePath}
                  onChange={(e) => setFormData({ ...formData, factorioExePath: e.target.value })}
                  className="flex-1 mono text-xs"
                />
                <Button variant="secondary" size="sm" onClick={handleBrowseExe}>
                  Browse…
                </Button>
              </div>
            </div>

            {/* Factorio AppData / Write Path */}
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-2)' }}>
                Factorio roaming directory (data path)
              </label>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g. C:\\Users\\<Username>\\AppData\\Roaming\\Factorio"
                  value={formData.factorioWritePath}
                  onChange={(e) => setFormData({ ...formData, factorioWritePath: e.target.value })}
                  className="flex-1 mono text-xs"
                />
                <Button variant="secondary" size="sm" onClick={handleBrowseWritePath}>
                  Browse…
                </Button>
              </div>
            </div>
          </div>

          {/* DOWNLOADS Section */}
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--text-3)' }}>
              DOWNLOADS
            </div>

            {/* Download Mirror */}
            <div className="mb-4">
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-2)' }}>
                Mod archive mirror
              </label>
              <Select
                value={formData.primaryMirror}
                onChange={(e) => setFormData({ ...formData, primaryMirror: e.target.value })}
                options={mirrorOptions}
                className="w-full"
              />
              <p className="text-[11px] mt-1" style={{ color: 'var(--text-3)' }}>
                The re146 mirror provides direct high-speed downloads without requiring your Factorio account token.
              </p>
            </div>
          </div>

          {/* LAUNCH Section */}
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--text-3)' }}>
              LAUNCH
            </div>

            {/* Custom Launch Args */}
            <div className="mb-4">
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-2)' }}>
                Custom launch arguments
              </label>
              <Input
                placeholder="e.g. --window-size 1920x1080"
                value={formData.customLaunchArgs}
                onChange={(e) => setFormData({ ...formData, customLaunchArgs: e.target.value })}
                className="w-full mono text-xs"
              />
            </div>

            {/* Checkboxes */}
            <div className="space-y-3 pt-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <Checkbox
                  checked={formData.autoCheckUpdates}
                  onChange={(checked) => setFormData({ ...formData, autoCheckUpdates: checked })}
                />
                <span className="text-xs" style={{ color: 'var(--text-1)' }}>
                  Automatically check for mod updates on startup
                </span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <Checkbox
                  checked={formData.closeOnLaunch}
                  onChange={(checked) => setFormData({ ...formData, closeOnLaunch: checked })}
                />
                <span className="text-xs" style={{ color: 'var(--text-1)' }}>
                  Close Foundry when Factorio starts
                </span>
              </label>
            </div>
          </div>
        </form>

        {/* Sticky Footer */}
        <div
          className="px-6 py-4 border-t flex items-center justify-between"
          style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-raised)' }}
        >
          <span className="text-xs" style={{ color: saved ? 'var(--success)' : 'transparent' }}>
            ✓ Settings saved
          </span>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save settings
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
