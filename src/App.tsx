import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Topbar } from './components/Topbar';
import { Sidebar, CategoryCounts, OFFICIAL_CATEGORIES, OFFICIAL_TAGS } from './components/Sidebar';
import { InstalledView } from './views/installed/InstalledView';
import { DiscoverView } from './views/discover/DiscoverView';
import { ProfilesView } from './components/ProfilesView';
import { DependenciesView } from './components/DependenciesView';
import { SettingsModal } from './components/SettingsModal';
import { DownloadBar } from './components/DownloadBar';
import { ConfirmModal } from './components/ConfirmModal';
import { ChangelogModal } from './components/ChangelogModal';
import { api } from './services/api';
import { AppSettings, DownloadProgress, ModProfile, ProfileDetail } from './types';
import { checkModDependencies } from './utils/helpers';

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'installed' | 'discover' | 'profiles' | 'dependencies'>('installed');
  const [profiles, setProfiles] = useState<ModProfile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string>('default');
  const [activeProfile, setActiveProfile] = useState<ProfileDetail | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [downloads, setDownloads] = useState<DownloadProgress[]>([]);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [launching, setLaunching] = useState(false);

  // Selected mod & filters
  const [selectedModName, setSelectedModName] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('Load order');

  // Modals
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [installingModName, setInstallingModName] = useState<string | null>(null);
  const [modToUninstall, setModToUninstall] = useState<string | null>(null);
  const [confirmSyncOpen, setConfirmSyncOpen] = useState(false);
  const [changelogModName, setChangelogModName] = useState<string | null>(null);
  const [showProfilesPage, setShowProfilesPage] = useState(false);

  // Toast notifications
  const [toast, setToast] = useState<{ message: string; type: 'info' | 'success' | 'error' } | null>(null);
  const toastTimerRef = useRef<any>(null);

  const showToast = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ message, type });
    toastTimerRef.current = setTimeout(() => setToast(null), 3500);
  };

  const loadProfiles = async () => {
    try {
      const list = await api.getProfiles();
      setProfiles(list);
    } catch (err) {
      console.error('Failed to load profiles:', err);
    }
  };

  const loadActiveProfile = async () => {
    setLoadingProfile(true);
    try {
      const profile = await api.getActiveProfile();
      setActiveProfile(profile);
      setActiveProfileId(profile.id);
    } catch (err) {
      console.error('Failed to load active profile:', err);
    } finally {
      setLoadingProfile(false);
    }
  };

  const loadSettings = async () => {
    try {
      const s = await api.getSettings();
      setSettings(s);
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  };

  useEffect(() => {
    loadProfiles();
    loadActiveProfile();
    loadSettings();

    // Subscribe to real-time download events via SSE / IPC
    const unsubscribe = api.subscribeDownloadEvents((progress) => {
      setDownloads((prev) => {
        const key = `${progress.modName}@${progress.version}`;
        const existingIdx = prev.findIndex((d) => `${d.modName}@${d.version}` === key);
        if (existingIdx >= 0) {
          const next = [...prev];
          next[existingIdx] = progress;
          return next;
        }
        return [...prev, progress];
      });

      if (progress.status === 'completed') {
        loadActiveProfile();
        loadProfiles();
        showToast(`Installed ${progress.title} v${progress.version}!`, 'success');
      } else if (progress.status === 'error') {
        showToast(`Error downloading ${progress.title}: ${progress.error}`, 'error');
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleSelectProfile = async (id: string) => {
    try {
      await api.setActiveProfile(id);
      setActiveProfileId(id);
      setSelectedModName(null);
      await loadActiveProfile();
      await loadProfiles();
      showToast('Switched profile', 'info');
    } catch (err: any) {
      showToast(`Failed to switch profile: ${err.message}`, 'error');
    }
  };

  const handleToggleMod = async (name: string, enabled: boolean) => {
    if (!activeProfile) return;
    try {
      // Optimistic update
      setActiveProfile({
        ...activeProfile,
        mods: activeProfile.mods.map((m) => (m.name === name ? { ...m, enabled } : m)),
      });
      await api.toggleMod(name, enabled, activeProfile.id);
      await loadProfiles();
    } catch (err: any) {
      showToast(`Error toggling mod: ${err.message}`, 'error');
      await loadActiveProfile();
    }
  };

  const handleUninstallMod = (name: string) => {
    setModToUninstall(name);
  };

  const executeUninstallMod = async () => {
    if (!activeProfile || !modToUninstall) return;
    const name = modToUninstall;
    setModToUninstall(null);

    try {
      await api.uninstallMod(name, activeProfile.id);
      if (selectedModName === name) setSelectedModName(null);
      await loadActiveProfile();
      await loadProfiles();
      showToast(`Uninstalled ${name}`, 'info');
    } catch (err: any) {
      showToast(`Error uninstalling mod: ${err.message}`, 'error');
    }
  };

  const handleInstallMod = async (name: string, version?: string) => {
    if (!activeProfile) return;
    setInstallingModName(name);
    showToast(`Downloading ${name}…`, 'info');

    try {
      const res = await api.installMod(name, version, activeProfile.id);
      if (res.installed.length > 0) {
        showToast(`Installed ${res.installed.map((i) => i.name).join(', ')}`, 'success');
        await loadActiveProfile();
        await loadProfiles();
      }
      if (res.errors.length > 0) {
        showToast(`Warning: ${res.errors.join('; ')}`, 'error');
      }
    } catch (err: any) {
      showToast(`Failed to install ${name}: ${err.message}`, 'error');
    } finally {
      setInstallingModName(null);
    }
  };

  const handleLaunchModded = async () => {
    setLaunching(true);
    try {
      const res = await api.launchModded(activeProfileId);
      if (res.success) {
        showToast('Factorio launched with active mod profile!', 'success');
      } else {
        showToast(res.message || 'Failed to launch Factorio', 'error');
      }
    } catch (err: any) {
      showToast(`Error launching game: ${err.message}`, 'error');
    } finally {
      setLaunching(false);
    }
  };

  const handleLaunchVanilla = async () => {
    setLaunching(true);
    try {
      const res = await api.launchVanilla();
      if (res.success) {
        showToast('Vanilla Factorio launched!', 'success');
      } else {
        showToast(res.message || 'Failed to launch vanilla Factorio', 'error');
      }
    } catch (err: any) {
      showToast(`Error launching vanilla: ${err.message}`, 'error');
    } finally {
      setLaunching(false);
    }
  };

  const handleSyncToGame = () => {
    setConfirmSyncOpen(true);
  };

  const executeSyncToGame = async () => {
    setConfirmSyncOpen(false);
    try {
      const res = await api.syncToGame(activeProfileId);
      if (res.success) {
        showToast(`Synced ${res.count} mods to %APPDATA%/Factorio/mods!`, 'success');
      } else {
        showToast(`Sync failed: ${res.error}`, 'error');
      }
    } catch (err: any) {
      showToast(`Error syncing to game directory: ${err.message}`, 'error');
    }
  };

  const handleDismissDownload = (key: string) => {
    setDownloads((prev) => prev.filter((d) => `${d.modName}@${d.version}` !== key));
  };

  const installedMods = activeProfile?.mods || [];
  const updatesAvailable = installedMods.filter((m) => m.hasUpdate);

  // Category counts
  const categoryCounts: CategoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: installedMods.length,
      content: 0,
      overhaul: 0,
      tweaks: 0,
      utilities: 0,
      'mod-packs': 0,
      scenarios: 0,
      localizations: 0,
      internal: 0,
    };

    installedMods.forEach((mod) => {
      let cat = mod.category?.toLowerCase();
      if (!cat || counts[cat] === undefined) {
        const text = `${mod.name} ${mod.title} ${mod.summary || ''}`.toLowerCase();
        if (text.match(/overhaul|space exploration|krastorio|seablock|bobs|angels|pyanodon/)) {
          cat = 'overhaul';
        } else if (text.match(/library|flib|stdlib|framework|internal/)) {
          cat = 'internal';
        } else if (text.match(/qol|quality of life|squeak|planner|calc|rate|inventory|cursor|quick/)) {
          cat = 'utilities';
        } else if (text.match(/tweak|balance|speed|stack|adjust/)) {
          cat = 'tweaks';
        } else if (text.match(/pack|modpack/)) {
          cat = 'mod-packs';
        } else if (text.match(/locale|translation|language/)) {
          cat = 'localizations';
        } else {
          cat = 'content';
        }
      }
      if (counts[cat] !== undefined) {
        counts[cat]++;
      }
    });

    return counts;
  }, [installedMods]);

  // Load order health
  const loadOrderVerified = useMemo(() => {
    return !installedMods.some((m) => checkModDependencies(m, installedMods).hasIssues);
  }, [installedMods]);

  return (
    <div className="app">
      {/* Toast Notification */}
      {toast && (
        <div
          className="fixed top-4 right-4 z-50 px-4 py-2.5 rounded-lg border text-xs font-semibold shadow-2xl animate-in fade-in slide-in-from-top-2 duration-150"
          style={{
            background: toast.type === 'error' ? 'var(--bad-bg)' : 'var(--panel)',
            borderColor:
              toast.type === 'error'
                ? 'var(--bad)'
                : toast.type === 'success'
                ? 'var(--good)'
                : 'var(--copper-dim)',
            color:
              toast.type === 'error'
                ? 'var(--bad)'
                : toast.type === 'success'
                ? 'var(--good)'
                : 'var(--text)',
          }}
        >
          {toast.message}
        </div>
      )}

      {/* Brand Top-Left Cell */}
      <div className="brand">
        <img src="/public/icon.png" className="brand-mark" style={{ width: 28, height: 28, borderRadius: 6, objectFit: 'cover' }} alt="Foundry" />
        <span className="brand-name">Foundry</span>
      </div>

      {/* Top Bar */}
      <Topbar
        activeProfile={activeProfile}
        profiles={profiles}
        onSelectProfile={handleSelectProfile}
        onOpenProfilesTab={() => setShowProfilesPage(true)}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder={
          currentView === 'discover'
            ? 'Search mod portal by name, tag, or author…'
            : 'Search installed mods…'
        }
        updatesCount={updatesAvailable.length}
        onShowUpdates={() => {
          setCurrentView('installed');
          setSortBy('Recently updated');
        }}
        onLaunchModded={handleLaunchModded}
        onLaunchVanilla={handleLaunchVanilla}
        onSyncToGame={handleSyncToGame}
        launching={launching}
      />

      {/* Sidebar */}
      <Sidebar
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        selectedTag={selectedTag}
        onSelectTag={setSelectedTag}
        counts={categoryCounts}
        loadOrderVerified={loadOrderVerified}
      />

      {/* Main Content Area */}
      <div className="main">
        {/* Navigation Tabs */}
        <div className="tabs">
          <div
            className={`tab ${currentView === 'installed' ? 'active' : ''}`}
            onClick={() => {
              setCurrentView('installed');
              setShowProfilesPage(false);
            }}
          >
            Installed <span className="n">{installedMods.length}</span>
          </div>

          <div
            className={`tab ${currentView === 'discover' ? 'active' : ''}`}
            onClick={() => {
              setCurrentView('discover');
              setShowProfilesPage(false);
            }}
          >
            Discover
          </div>

          <div
            className={`tab ${currentView === 'dependencies' ? 'active' : ''}`}
            onClick={() => {
              setCurrentView('dependencies');
              setShowProfilesPage(false);
            }}
          >
            Dependencies
          </div>
        </div>

        {/* Tab View Switcher */}
        {currentView === 'installed' && !showProfilesPage && (
          <InstalledView
            mods={installedMods}
            loading={loadingProfile}
            selectedModName={selectedModName}
            onSelectMod={setSelectedModName}
            onToggleMod={handleToggleMod}
            onUninstallMod={handleUninstallMod}
            onUpdateMod={(name, ver) => handleInstallMod(name, ver)}
            onInstallMissingDep={(name, ver) => handleInstallMod(name, ver)}
            onOpenChangelog={(name) => setChangelogModName(name)}
            onGoToOnline={() => setCurrentView('discover')}
            onRefresh={loadActiveProfile}
            searchQuery={searchQuery}
            selectedCategory={selectedCategory}
            selectedTag={selectedTag}
            sortBy={sortBy}
            onSortByChange={setSortBy}
          />
        )}

        {currentView === 'discover' && !showProfilesPage && (
          <DiscoverView
            installedMods={installedMods}
            onInstallMod={handleInstallMod}
            selectedModName={selectedModName}
            onSelectMod={setSelectedModName}
            installingModName={installingModName}
            searchQuery={searchQuery}
            selectedCategory={selectedCategory}
            selectedTag={selectedTag}
          />
        )}

        {currentView === 'dependencies' && !showProfilesPage && (
          <DependenciesView
            mods={installedMods}
            onInstallMod={handleInstallMod}
            onShowToast={showToast}
          />
        )}

        {(showProfilesPage || currentView === 'profiles') && (
          <ProfilesView
            profiles={profiles}
            activeProfileId={activeProfileId}
            onSelectProfile={handleSelectProfile}
            onRefreshProfiles={() => {
              loadProfiles();
              loadActiveProfile();
            }}
            onShowToast={showToast}
          />
        )}
      </div>

      {/* Mod Changelog Modal */}
      {changelogModName && (
        <ChangelogModal
          modName={changelogModName}
          onClose={() => setChangelogModName(null)}
        />
      )}

      {/* Settings Modal */}
      {isSettingsModalOpen && (
        <SettingsModal
          settings={settings}
          onClose={() => setIsSettingsModalOpen(false)}
          onUpdateSettings={(newSettings) => setSettings(newSettings)}
        />
      )}

      {/* Floating Download Bar */}
      <DownloadBar downloads={downloads} onDismiss={handleDismissDownload} />

      {/* Confirm Uninstall Modal */}
      <ConfirmModal
        isOpen={!!modToUninstall}
        title="Uninstall mod"
        message={`Are you sure you want to uninstall "${modToUninstall}" from this profile? The local mod archive will be deleted.`}
        confirmText="Uninstall"
        confirmVariant="danger"
        onConfirm={executeUninstallMod}
        onCancel={() => setModToUninstall(null)}
      />

      {/* Confirm Sync to Game Modal */}
      <ConfirmModal
        isOpen={confirmSyncOpen}
        title="Sync to Factorio"
        message={`Syncing will copy all enabled and disabled mods and mod-list.json from profile "${activeProfile?.name || 'Active'}" directly into your Factorio roaming mods folder (%APPDATA%/Factorio/mods), overwriting existing mods there. This allows you to launch Factorio directly from Steam with this mod setup. Continue?`}
        confirmText="Sync now"
        confirmVariant="warning"
        onConfirm={executeSyncToGame}
        onCancel={() => setConfirmSyncOpen(false)}
      />
    </div>
  );
};
