import React, { useState } from 'react';
import { AppSettings } from '../types';
import { api } from '../services/api';

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div
        className="w-full max-w-xl rounded-lg border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}
      >
        {/* Header */}
        <div
          className="px-6 py-4 border-b flex items-center justify-between"
          style={{ borderColor: 'var(--line)', background: 'var(--ink)' }}
        >
          <div className="flex items-center gap-2">
            <span className="slab text-base font-semibold" style={{ color: 'var(--text)' }}>
              Application settings
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-[var(--panel-2)] transition-colors"
            style={{ color: 'var(--text-faint)' }}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-5">
          {errorMessage && (
            <div className="dep-note">
              <b>Error:</b> {errorMessage}
            </div>
          )}

          {/* Factorio Exe */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold" style={{ color: 'var(--text)' }}>
                Factorio executable (factorio.exe)
              </label>
              <button
                type="button"
                onClick={handleAutoDetect}
                disabled={detecting}
                className="text-xs underline hover:opacity-80 cursor-pointer"
                style={{ color: 'var(--copper)' }}
              >
                {detecting ? 'Detecting…' : 'Auto-detect'}
              </button>
            </div>
            <div className="flex gap-2">
              <div className="search flex-1">
                <input
                  type="text"
                  placeholder="e.g. C:\Games\Factorio\bin\x64\factorio.exe"
                  value={formData.factorioExePath}
                  onChange={(e) => setFormData({ ...formData, factorioExePath: e.target.value })}
                  className="mono text-xs"
                />
              </div>
              <button type="button" onClick={handleBrowseExe} className="btn text-xs px-3">
                Browse…
              </button>
            </div>
          </div>

          {/* Factorio AppData / Write Path */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text)' }}>
              Factorio roaming directory (data path)
            </label>
            <div className="flex gap-2">
              <div className="search flex-1">
                <input
                  type="text"
                  placeholder="e.g. C:\Users\<Username>\AppData\Roaming\Factorio"
                  value={formData.factorioWritePath}
                  onChange={(e) => setFormData({ ...formData, factorioWritePath: e.target.value })}
                  className="mono text-xs"
                />
              </div>
              <button type="button" onClick={handleBrowseWritePath} className="btn text-xs px-3">
                Browse…
              </button>
            </div>
          </div>

          {/* Download Mirror */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text)' }}>
              Mod archive mirror
            </label>
            <select
              value={formData.primaryMirror}
              onChange={(e) => setFormData({ ...formData, primaryMirror: e.target.value })}
              className="w-full text-xs"
            >
              <option value="https://mods-storage.re146.dev/">
                re146 Cloudflare R2 mirror (Fast, no login required)
              </option>
              <option value="https://mods.factorio.com/">
                Official Factorio Mod Portal (Fallback)
              </option>
            </select>
            <p className="text-[11px] mt-1" style={{ color: 'var(--text-dim)' }}>
              The re146 mirror provides direct high-speed downloads without requiring your Factorio account token.
            </p>
          </div>

          {/* Custom Launch Args */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text)' }}>
              Custom launch arguments
            </label>
            <div className="search w-full">
              <input
                type="text"
                placeholder="e.g. --window-size 1920x1080"
                value={formData.customLaunchArgs}
                onChange={(e) => setFormData({ ...formData, customLaunchArgs: e.target.value })}
                className="mono text-xs"
              />
            </div>
          </div>

          {/* Checkboxes */}
          <div className="space-y-3 pt-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.autoCheckUpdates}
                onChange={(e) => setFormData({ ...formData, autoCheckUpdates: e.target.checked })}
                className="rounded accent-[#e0954a]"
              />
              <span className="text-xs" style={{ color: 'var(--text)' }}>
                Automatically check for mod updates on startup
              </span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.closeOnLaunch}
                onChange={(e) => setFormData({ ...formData, closeOnLaunch: e.target.checked })}
                className="rounded accent-[#e0954a]"
              />
              <span className="text-xs" style={{ color: 'var(--text)' }}>
                Close Foundry when Factorio starts
              </span>
            </label>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t flex items-center justify-between" style={{ borderColor: 'var(--line)' }}>
            <span className="text-xs" style={{ color: saved ? 'var(--good)' : 'transparent' }}>
              ✓ Settings saved
            </span>
            <div className="flex gap-2">
              <button type="button" onClick={onClose} className="btn text-xs px-4">
                Cancel
              </button>
              <button type="submit" className="btn btn-primary text-xs px-4">
                Save settings
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
