import React from 'react';

export type CategoryCounts = Record<string, number>;

export const OFFICIAL_CATEGORIES = [
  {
    id: 'all',
    label: 'All mods',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    id: 'content',
    label: 'Content',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
        <line x1="12" y1="22.08" x2="12" y2="12" />
      </svg>
    ),
  },
  {
    id: 'overhaul',
    label: 'Overhaul',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <circle cx="12" cy="12" r="6" />
        <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(-20 12 12)" />
      </svg>
    ),
  },
  {
    id: 'tweaks',
    label: 'Tweaks',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" />
        <line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" />
        <line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" />
        <line x1="1" y1="14" x2="7" y2="14" /><line x1="9" y1="8" x2="15" y2="8" />
        <line x1="17" y1="16" x2="23" y2="16" />
      </svg>
    ),
  },
  {
    id: 'utilities',
    label: 'Utilities',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
      </svg>
    ),
  },
  {
    id: 'mod-packs',
    label: 'Mod packs',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <polygon points="12 2 2 7 12 12 22 7 12 2" />
        <polyline points="2 17 12 22 22 17" />
        <polyline points="2 12 12 17 22 12" />
      </svg>
    ),
  },
  {
    id: 'scenarios',
    label: 'Scenarios',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
        <line x1="4" y1="22" x2="4" y2="15" />
      </svg>
    ),
  },
  {
    id: 'localizations',
    label: 'Localizations',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    ),
  },
  {
    id: 'internal',
    label: 'Internal',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <polyline points="4 17 10 11 4 5" />
        <line x1="12" y1="19" x2="20" y2="19" />
      </svg>
    ),
  },
];

export const OFFICIAL_TAGS = [
  { id: 'space-age', label: 'space-age', isExpansion: true },
  { id: 'planets', label: 'planets' },
  { id: 'logistics', label: 'logistics' },
  { id: 'trains', label: 'trains' },
  { id: 'transportation', label: 'transportation' },
  { id: 'combat', label: 'combat' },
  { id: 'power', label: 'power' },
  { id: 'manufacturing', label: 'manufacturing' },
  { id: 'circuit-network', label: 'circuit-network' },
  { id: 'fluids', label: 'fluids' },
  { id: 'mining', label: 'mining' },
  { id: 'enemies', label: 'enemies' },
  { id: 'armor', label: 'armor' },
  { id: 'character', label: 'character' },
  { id: 'storage', label: 'storage' },
  { id: 'blueprints', label: 'blueprints' },
  { id: 'cheats', label: 'cheats' },
];

interface SidebarProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  selectedTag: string | null;
  onSelectTag: (tag: string | null) => void;
  counts: CategoryCounts;
  loadOrderVerified?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  selectedCategory,
  onSelectCategory,
  selectedTag,
  onSelectTag,
  counts,
  loadOrderVerified = true,
}) => {
  return (
    <div className="side">
      <div className="side-scroll">
        {/* Categories Section */}
        <div className="side-section">
          <div className="side-label">Categories</div>

          {OFFICIAL_CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat.id;
            const count = counts[cat.id] ?? 0;

            return (
              <div
                key={cat.id}
                className={`cat ${isActive ? 'active' : ''}`}
                onClick={() => onSelectCategory(cat.id)}
              >
                {cat.icon}
                {cat.label} <span className="n">{count}</span>
              </div>
            );
          })}
        </div>

        <div className="side-divider"></div>

        {/* Filters Section */}
        <div className="side-section">
          <div className="side-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Filters</span>
            {selectedTag && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectTag(null);
                }}
                style={{
                  fontSize: '10.5px',
                  color: 'var(--copper)',
                  background: 'transparent',
                  border: 'none',
                  padding: '0 4px',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
                title="Clear active filter"
              >
                Clear
              </button>
            )}
          </div>
          <div className="tags-row">
            {OFFICIAL_TAGS.map((tag) => {
              const isSelected = selectedTag === tag.id;
              return (
                <span
                  key={tag.id}
                  className={`tag-chip ${isSelected ? 'active' : ''} ${tag.isExpansion ? 'expansion' : ''}`}
                  style={
                    tag.isExpansion
                      ? {
                          borderColor: isSelected ? 'var(--copper)' : 'var(--copper-dim)',
                          color: isSelected ? '#17140f' : 'var(--copper)',
                          background: isSelected ? 'var(--copper)' : 'var(--copper-glow)',
                          fontWeight: 600,
                        }
                      : undefined
                  }
                  onClick={() => onSelectTag(isSelected ? null : tag.id)}
                  title={tag.isExpansion ? 'Space Age expansion filter' : `Filter by ${tag.label}`}
                >
                  {tag.label}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="side-footer">
        <div className="integrity">
          <span>Load order</span>
          <b>{loadOrderVerified ? 'verified' : 'attention'}</b>
        </div>
        <div className="bar">
          <i style={{ width: loadOrderVerified ? '94%' : '50%', background: loadOrderVerified ? 'var(--good)' : 'var(--warn)' }}></i>
        </div>
      </div>
    </div>
  );
};
