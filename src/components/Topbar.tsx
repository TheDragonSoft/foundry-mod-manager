import React, { useState, useRef, useEffect } from 'react';
import { ModProfile } from '../types';

interface TopbarProps {
  activeProfile: ModProfile | null;
  profiles: ModProfile[];
  onSelectProfile: (id: string) => void;
  onOpenProfilesTab: () => void;
  onOpenSettings: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  searchPlaceholder?: string;
  updatesCount: number;
  onShowUpdates: () => void;
  onLaunchModded: () => void;
  onLaunchVanilla: () => void;
  onSyncToGame: () => void;
  launching: boolean;
}

export const Topbar: React.FC<TopbarProps> = ({
  activeProfile,
  profiles,
  onSelectProfile,
  onOpenProfilesTab,
  onOpenSettings,
  searchQuery,
  onSearchChange,
  searchPlaceholder = 'Search installed mods…',
  updatesCount,
  onShowUpdates,
  onLaunchModded,
  onLaunchVanilla,
  onSyncToGame,
  launching,
}) => {
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }
      if (e.key === 'Escape') {
        setProfileDropdownOpen(false);
        setMenuOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setProfileDropdownOpen(false);
      }
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);

  const getProfileStatusText = (profile: ModProfile | null) => {
    if (!profile || profile.modsCount === 0) return '(0 enabled)';
    if (profile.enabledCount === profile.modsCount) {
      return `(${profile.enabledCount} enabled)`;
    }
    return `(${profile.enabledCount}/${profile.modsCount} enabled)`;
  };

  return (
    <div className="topbar">
      {/* Profile Pill */}
      <div className="relative" ref={dropdownRef}>
        <div
          className="profile-pill"
          onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
          title="Click to switch or manage profiles"
        >
          <span className="dot"></span>
          <span className="name">{activeProfile?.name || 'Default'}</span>
          <span className="mono" style={{ color: 'var(--text-dim)', fontSize: '11.5px' }}>
            {getProfileStatusText(activeProfile)}
          </span>
          <span className="chev">{profileDropdownOpen ? '▴' : '▾'}</span>
        </div>

        {/* Profile Dropdown */}
        {profileDropdownOpen && (
          <div
            className="absolute top-full left-0 mt-1.5 w-60 py-1.5 rounded-lg border z-50 shadow-2xl"
            style={{
              background: 'var(--panel)',
              borderColor: 'var(--line)',
            }}
          >
            <div
              className="px-3 py-1.5 text-[11px] font-semibold tracking-wider uppercase"
              style={{ color: 'var(--text-faint)' }}
            >
              Switch profile
            </div>
            {profiles.map((p) => {
              const isActive = p.id === activeProfile?.id;
              return (
                <div
                  key={p.id}
                  onClick={() => {
                    onSelectProfile(p.id);
                    setProfileDropdownOpen(false);
                  }}
                  className="px-3 py-2 text-xs flex items-center justify-between cursor-pointer transition-colors"
                  style={{
                    background: isActive ? 'var(--copper-glow)' : 'transparent',
                    color: isActive ? 'var(--copper)' : 'var(--text)',
                  }}
                >
                  <span className="font-semibold truncate">{p.name}</span>
                  <span className="mono text-[11px]" style={{ color: 'var(--text-dim)' }}>
                    {p.modsCount === 0
                      ? '0 enabled'
                      : p.enabledCount === p.modsCount
                      ? `${p.enabledCount} enabled`
                      : `${p.enabledCount}/${p.modsCount} enabled`}
                  </span>
                </div>
              );
            })}
            <div className="border-t my-1" style={{ borderColor: 'var(--line)' }}></div>
            <div
              onClick={() => {
                setProfileDropdownOpen(false);
                onOpenProfilesTab();
              }}
              className="px-3 py-2 text-xs cursor-pointer transition-colors font-medium flex items-center justify-between hover:bg-[var(--panel-2)]"
              style={{ color: 'var(--copper)' }}
            >
              <span>Manage all profiles…</span>
              <span>→</span>
            </div>
          </div>
        )}
      </div>

      {/* Search Field */}
      <div className="search">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
          <path d="M21 21l-4.3-4.3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <input
          ref={searchInputRef}
          placeholder={searchPlaceholder}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          spellCheck={false}
        />
        <kbd>{isMac ? '⌘K' : 'Ctrl+K'}</kbd>
      </div>

      {/* Topbar Actions */}
      <div className="topbar-actions">
        {updatesCount > 0 && (
          <button
            className="btn btn-updates"
            onClick={onShowUpdates}
            title={`${updatesCount} mod updates available`}
          >
            Updates <span className="count">{updatesCount}</span>
          </button>
        )}

        {/* Primary Launch Button */}
        <button
          className="btn btn-primary"
          onClick={onLaunchModded}
          disabled={launching}
          title="Launch Factorio with active mod profile"
        >
          {launching ? 'Launching…' : '▶ Launch Factorio'}
        </button>

        {/* Overflow Menu (Vanilla, Sync, Settings) */}
        <div className="relative" ref={menuRef}>
          <button
            className="btn"
            style={{ padding: '8px 10px' }}
            onClick={() => setMenuOpen(!menuOpen)}
            title="More actions"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="5" r="1.5" fill="currentColor" />
              <circle cx="12" cy="12" r="1.5" fill="currentColor" />
              <circle cx="12" cy="19" r="1.5" fill="currentColor" />
            </svg>
          </button>

          {menuOpen && (
            <div
              className="absolute right-0 top-full mt-1.5 w-52 py-1.5 rounded-lg border z-50 shadow-2xl"
              style={{
                background: 'var(--panel)',
                borderColor: 'var(--line)',
              }}
            >
              <div
                onClick={() => {
                  setMenuOpen(false);
                  onLaunchVanilla();
                }}
                className="px-3 py-2 text-xs cursor-pointer transition-colors hover:bg-[var(--panel-2)] flex items-center justify-between"
                style={{ color: 'var(--text)' }}
              >
                <span>Launch vanilla Factorio</span>
              </div>
              <div
                onClick={() => {
                  setMenuOpen(false);
                  onSyncToGame();
                }}
                className="px-3 py-2 text-xs cursor-pointer transition-colors hover:bg-[var(--panel-2)] flex items-center justify-between"
                style={{ color: 'var(--text)' }}
                title="Copy profile to %APPDATA%/Factorio/mods for Steam direct launch"
              >
                <span>Sync to Steam folder</span>
              </div>
              <div className="border-t my-1" style={{ borderColor: 'var(--line)' }}></div>
              <div
                onClick={() => {
                  setMenuOpen(false);
                  onOpenSettings();
                }}
                className="px-3 py-2 text-xs cursor-pointer transition-colors hover:bg-[var(--panel-2)] flex items-center justify-between"
                style={{ color: 'var(--text)' }}
              >
                <span>Settings</span>
                <span className="mono" style={{ color: 'var(--text-faint)', fontSize: '11px' }}>⚙</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
