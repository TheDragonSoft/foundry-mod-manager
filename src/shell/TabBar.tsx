import React from 'react';

interface Tab {
  id: string;
  label: string;
  count?: number;
}

interface TabBarProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export const TabBar: React.FC<TabBarProps> = ({ tabs, activeTab, onTabChange }) => {
  return (
    <div 
      className="tabbar"
      role="tablist"
      style={{
        height: '40px',
        background: 'var(--bg-app)',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 24px',
        gap: '8px',
      }}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <div
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onTabChange(tab.id)}
            style={{
              height: '40px',
              padding: '0 4px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '13px',
              fontWeight: 500,
              color: isActive ? 'var(--text-1)' : 'var(--text-2)',
              cursor: 'pointer',
              position: 'relative',
              transition: 'color var(--t-fast)',
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                (e.currentTarget as HTMLElement).style.color = 'var(--text-1)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                (e.currentTarget as HTMLElement).style.color = 'var(--text-2)';
              }
            }}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span 
                className="tab-count"
                style={{
                  fontSize: '11px',
                  padding: '2px 6px',
                  borderRadius: 'var(--r-sm)',
                  background: 'var(--bg-panel)',
                  color: 'var(--text-3)',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                {tab.count}
              </span>
            )}
            {isActive && (
              <div 
                className="tab-indicator"
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: '2px',
                  background: 'var(--accent)',
                  transition: 'transform var(--t-med)',
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};
