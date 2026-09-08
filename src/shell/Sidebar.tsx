import React from 'react';
import { Badge } from '../primitives/Badge';

interface Category {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface SidebarProps {
  categories: Category[];
  counts: Record<string, number>;
  selectedCategory: string;
  onSelectCategory: (id: string) => void;
  filterCount?: number;
  onOpenFilters?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  categories,
  counts,
  selectedCategory,
  onSelectCategory,
  filterCount = 0,
  onOpenFilters,
}) => {
  return (
    <div 
      className="sidebar"
      style={{
        width: '240px',
        background: 'var(--bg-panel)',
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Single scroll region */}
      <div 
        className="sidebar-scroll"
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 12px',
        }}
      >
        {/* Categories Section */}
        <div style={{ marginBottom: '16px' }}>
          <div 
            style={{
              fontSize: '11px',
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--text-3)',
              marginBottom: '8px',
              paddingLeft: '8px',
            }}
          >
            Categories
          </div>
          {categories.map((cat) => {
            const isActive = selectedCategory === cat.id;
            const count = counts[cat.id] ?? 0;
            const displayCount = count === 0 ? '–' : count.toString();
            const countOpacity = count === 0 ? 0.4 : 1;

            return (
              <div
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                style={{
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '0 8px',
                  borderRadius: 'var(--r-sm)',
                  fontSize: '13px',
                  color: isActive ? 'var(--text-1)' : 'var(--text-2)',
                  background: isActive ? 'var(--bg-active)' : 'transparent',
                  cursor: 'pointer',
                  transition: 'all var(--t-fast)',
                  position: 'relative',
                  ...(isActive && { borderLeft: '2px solid var(--accent)' }),
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)';
                    (e.currentTarget as HTMLElement).style.color = 'var(--text-1)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLElement).style.background = 'transparent';
                    (e.currentTarget as HTMLElement).style.color = 'var(--text-2)';
                  }
                }}
              >
                {cat.icon && (
                  <span style={{ width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {cat.icon}
                  </span>
                )}
                <span style={{ flex: 1 }}>{cat.label}</span>
                <span 
                  className="mono"
                  style={{ 
                    fontSize: '12px', 
                    color: 'var(--text-3)',
                    fontFamily: 'var(--font-mono)',
                    opacity: countOpacity,
                  }}
                >
                  {displayCount}
                </span>
              </div>
            );
          })}
        </div>

        {/* Filters Button */}
        <div>
          <div 
            style={{
              fontSize: '11px',
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--text-3)',
              marginBottom: '8px',
              paddingLeft: '8px',
            }}
          >
            Filters
          </div>
          <button
            onClick={onOpenFilters}
            style={{
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 8px',
              width: '100%',
              borderRadius: 'var(--r-sm)',
              fontSize: '13px',
              color: 'var(--text-2)',
              background: 'var(--bg-raised)',
              border: '1px solid var(--border-subtle)',
              cursor: 'pointer',
              transition: 'all var(--t-fast)',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = 'var(--bg-raised)';
            }}
          >
            <span>Filters</span>
            {filterCount > 0 && (
              <Badge tone="neutral" variant="subtle" size="sm">
                {filterCount}
              </Badge>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
