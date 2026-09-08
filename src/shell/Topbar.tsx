import React, { useState, useRef, useEffect } from 'react';
import { ModProfile } from '../types';
import { Badge } from '../primitives/Badge';
import { Input } from '../primitives/Input';
import { Kbd } from '../primitives/Kbd';
import { IconButton } from '../primitives/IconButton';
import { Button } from '../primitives/Button';

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
  loadOrderVerified?: boolean;
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
  loadOrderVerified = true,
}) => {
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

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
    <div 
      className="topbar"
      style={{
        height: '56px',
        background: 'var(--bg-panel)',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        gap: '16px',
      }}
    >
      <div className="relative" ref={dropdownRef} style={{ flexShrink: 0 }}>
        <div
          className="profile-pill"
          onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
          title="Click to switch or manage profiles"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 12px',
            borderRadius: 'var(--r-md)',
            background: 'var(--bg-raised)',
            border: '1px solid var(--border-subtle)',
            cursor: 'pointer',
            transition: 'background var(--t-fast)',
          }}
        >
          <span className="dot" style={{ width: '8px', height: '8px', borderRadius: '50%', background: activeProfile && activeProfile.enabledCount > 0 ? 'var(--success)' : 'var(--text-disabled)' }} />
          <span className="name" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-1)' }}>{activeProfile?.name || 'Default'}</span>
          <Badge variant="subtle" tone="neutral" size="sm" style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>{getProfileStatusText(activeProfile)}</Badge>
          <span className="chev" style={{ color: 'var(--text-3)', fontSize: '10px' }}>{profileDropdownOpen ? '▴' : '▾'}</span>
        </div>
        {profileDropdownOpen && (
          <div className="profile-dropdown" style={{ position: 'absolute', top: '100%', left: 0, marginTop: '6px', width: '256px', padding: '6px 0', borderRadius: 'var(--r-lg)', background: 'var(--bg-raised)', border: '1px solid var(--border-strong)', boxShadow: '0 12px 32px rgba(0,0,0,0.45)', zIndex: 50 }}>
            <div style={{ padding: '6px 12px', fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-3)' }}>Switch profile</div>
            {profiles.map((p) => {
              const isActive = p.id === activeProfile?.id;
              return (
                <div key={p.id} onClick={() => { onSelectProfile(p.id); setProfileDropdownOpen(false); }} style={{ padding: '8px 12px', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', background: isActive ? 'var(--bg-active)' : 'transparent', color: isActive ? 'var(--text-1)' : 'var(--text-2)', transition: 'background var(--t-fast)' }}>
                  <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                  <span className="mono" style={{ fontSize: '11px', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>{p.modsCount === 0 ? '0 enabled' : p.enabledCount === p.modsCount ? `${p.enabledCount} enabled` : `${p.enabledCount}/${p.modsCount} enabled`}</span>
                </div>
              );
            })}
            <div style={{ margin: '6px 0', borderTop: '1px solid var(--border-subtle)' }} />
            <div onClick={() => { setProfileDropdownOpen(false); onOpenProfilesTab(); }} style={{ padding: '8px 12px', fontSize: '13px', fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', color: 'var(--accent)', transition: 'background var(--t-fast)' }}><span>Manage all profiles…</span><span>→</span></div>
          </div>
        )}
      </div>
      <div className="search" style={{ flex: 1, maxWidth: '560px', position: 'relative' }}>
        <Input ref={searchInputRef as any} placeholder={searchPlaceholder} value={searchQuery} onChange={(e) => onSearchChange(e.target.value)} spellCheck={false} style={{ width: '100%', height: '36px', paddingRight: '64px' }} />
        <div style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', gap: '6px', pointerEvents: 'none' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--text-3)' }}><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" strokeLinecap="round" /></svg>
          <Kbd>{isMac ? '⌘K' : 'Ctrl+K'}</Kbd>
        </div>
      </div>
      <div className="topbar-actions" style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
        <Badge tone={loadOrderVerified ? 'success' : 'danger'} variant="subtle" style={{ cursor: 'pointer', transition: 'background var(--t-fast)' }} onClick={onShowUpdates} title="View dependency health">Dependencies {loadOrderVerified ? 'OK' : 'Issues'}</Badge>
        {updatesCount > 0 && (<Button variant="secondary" size="sm" onClick={onShowUpdates} title={`${updatesCount} mod updates available`} style={{ padding: '6px 12px' }}>Updates<Badge tone="warn" variant="subtle" size="sm" style={{ marginLeft: '6px' }}>{updatesCount}</Badge></Button>)}
        <Button variant="primary" onClick={onLaunchModded} disabled={launching} title="Launch Factorio with active mod profile" style={{ padding: '8px 16px' }}>{launching ? 'Launching…' : '▶ Launch Factorio'}</Button>
        <div className="relative" ref={menuRef}>
          <IconButton icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="12" cy="19" r="2" /></svg>} ariaLabel="More actions" tooltip="More actions" onClick={() => setMenuOpen(!menuOpen)} variant="ghost" size="md" />
          {menuOpen && (
            <div className="overflow-menu" style={{ position: 'absolute', right: 0, top: '100%', marginTop: '6px', width: '220px', padding: '6px 0', borderRadius: 'var(--r-lg)', background: 'var(--bg-raised)', border: '1px solid var(--border-strong)', boxShadow: '0 12px 32px rgba(0,0,0,0.45)', zIndex: 50 }}>
              <div onClick={() => { setMenuOpen(false); onLaunchVanilla(); }} style={{ padding: '8px 12px', fontSize: '13px', cursor: 'pointer', color: 'var(--text-1)', transition: 'background var(--t-fast)' }}>Launch vanilla Factorio</div>
              <div onClick={() => { setMenuOpen(false); onSyncToGame(); }} style={{ padding: '8px 12px', fontSize: '13px', cursor: 'pointer', color: 'var(--text-1)', transition: 'background var(--t-fast)' }} title="Copy profile to %APPDATA%/Factorio/mods for Steam direct launch">Sync to Steam folder</div>
              <div style={{ margin: '6px 0', borderTop: '1px solid var(--border-subtle)' }} />
              <div onClick={() => { setMenuOpen(false); onOpenSettings(); }} style={{ padding: '8px 12px', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-1)', transition: 'background var(--t-fast)' }}><span>Settings</span><span className="mono" style={{ fontSize: '11px', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>⚙</span></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
