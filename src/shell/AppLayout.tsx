import React from 'react';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  return (
    <div 
      className="app-layout"
      style={{
        display: 'grid',
        gridTemplateColumns: '240px 1fr',
        gridTemplateRows: '40px 56px 40px 1fr',
        height: '100vh',
        background: 'var(--bg-app)',
      }}
    >
      {/* Titlebar - row 1 */}
      <div 
        style={{
          gridColumn: '1 / -1',
          gridRow: '1',
        }}
      >
        {/* Titlebar injected by parent */}
      </div>

      {/* Topbar - row 2 */}
      <div 
        style={{
          gridColumn: '1 / -1',
          gridRow: '2',
        }}
      >
        {/* Topbar injected by parent */}
      </div>

      {/* TabBar - row 3 */}
      <div 
        style={{
          gridColumn: '1 / -1',
          gridRow: '3',
        }}
      >
        {/* TabBar injected by parent */}
      </div>

      {/* Main content area - row 4 */}
      <div 
        style={{
          gridColumn: '2',
          gridRow: '4',
          overflow: 'hidden',
        }}
      >
        <div 
          style={{
            height: '100%',
            padding: '24px',
            overflowY: 'auto',
          }}
        >
          {children}
        </div>
      </div>

      {/* Sidebar - spans rows 3-4 */}
      <div 
        style={{
          gridColumn: '1',
          gridRow: '3 / -1',
        }}
      >
        {/* Sidebar injected by parent */}
      </div>
    </div>
  );
};
