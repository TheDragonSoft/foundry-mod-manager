import React from 'react';
import { InstalledMod, ModItem } from '../types';
import { Switch, Badge } from '../primitives';
import { formatBytes, getThumbnailUrl } from '../utils/helpers';

interface ModRowProps {
  mod: InstalledMod | ModItem;
  isInstalled?: boolean;
  isSelected?: boolean;
  hasUpdate?: boolean;
  hasIssues?: boolean;
  category?: string;
  onSelect: () => void;
  onToggle?: (enabled: boolean) => void;
  onInstall?: () => void;
  installing?: boolean;
}

export const ModRow: React.FC<ModRowProps> = ({
  mod,
  isInstalled = false,
  isSelected = false,
  hasUpdate = false,
  hasIssues = false,
  category,
  onSelect,
  onToggle,
  onInstall,
  installing = false,
}) => {
  const isModItem = !('enabled' in mod);
  const installedMod = isModItem ? null : (mod as InstalledMod);
  const onlineMod = isModItem ? (mod as ModItem) : null;

  const title = mod.title;
  const summary = mod.summary || 'No description provided.';
  const author = isModItem ? (mod as ModItem).owner : (mod as InstalledMod).author;
  const version = isModItem 
    ? (mod as ModItem).latest_release?.version || '—'
    : (mod as InstalledMod).version;
  const sizeOrDownloads = isModItem
    ? `${formatDownloads((mod as ModItem).downloads_count)} dl`
    : formatBytes((mod as InstalledMod).fileSizeBytes);

  const thumbUrl = getThumbnailUrl(mod.thumbnail);

  const isOverhaul = category === 'overhaul' || title.toLowerCase().includes('space exploration');

  return (
    <div
      className={`mod-row ${isSelected ? 'selected' : ''} ${hasIssues ? 'conflict' : ''}`}
      onClick={onSelect}
      role="option"
      aria-selected={isSelected}
    >
      {/* Thumbnail */}
      <div className="mod-row-thumb">
        {thumbUrl ? (
          <img
            src={thumbUrl}
            alt={title}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
              const fb = (e.target as HTMLElement).nextElementSibling as HTMLElement;
              if (fb) fb.style.display = 'block';
            }}
          />
        ) : null}
        <svg
          style={{ display: thumbUrl ? 'none' : 'block' }}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
        >
          <rect x="3" y="3" width="18" height="18" rx="3" />
          {isModItem ? (
            <circle cx="12" cy="12" r="3" />
          ) : (
            <path d="M8 12h8M12 8v8" />
          )}
        </svg>
      </div>

      {/* Title + Description */}
      <div className="mod-row-main">
        <div className="mod-row-title">
          <span className="mod-row-name">{title}</span>
          {isOverhaul && <Badge tone="warn" variant="outline">Overhaul</Badge>}
          {category && !isOverhaul && <Badge tone="neutral" variant="subtle">{category}</Badge>}
          {hasUpdate && <Badge tone="warn" variant="outline">Update</Badge>}
        </div>
        <div className="mod-row-desc">{summary}</div>
      </div>

      {/* Author */}
      <div className="mod-row-author" title={author}>
        {author || 'Unknown'}
      </div>

      {/* Version */}
      <div className="mod-row-version">{version}</div>

      {/* Size or Downloads */}
      <div className="mod-row-meta">{sizeOrDownloads}</div>

      {/* Actions */}
      <div className="mod-row-actions" onClick={(e) => e.stopPropagation()}>
        {isInstalled && installedMod ? (
          <Switch
            checked={installedMod.enabled}
            onChange={onToggle}
            aria-label={installedMod.enabled ? `Disable ${title}` : `Enable ${title}`}
            size="sm"
          />
        ) : (
          <>
            {onlineMod && (
              <span className="mod-row-installed-indicator" style={{ color: 'var(--success)', marginRight: '8px' }}>
                ✓
              </span>
            )}
            {onInstall && (
              <button
                className="btn btn-secondary btn-sm"
                disabled={installing}
                onClick={onInstall}
              >
                {installing ? '…' : '+ Get'}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

function formatDownloads(count?: number): string {
  if (!count) return '0';
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(0)}k`;
  return String(count);
}
