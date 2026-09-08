import React from 'react';
import { IconButton } from '../primitives/IconButton';

interface TitlebarProps {
  title?: string;
}

export const Titlebar: React.FC<TitlebarProps> = ({ title = 'Foundry' }) => {
  const handleMinimize = () => {
    if ((window as any).electronAPI) {
      (window as any).electronAPI.minimizeWindow();
    }
  };

  const handleMaximize = () => {
    if ((window as any).electronAPI) {
      (window as any).electronAPI.maximizeWindow();
    }
  };

  const handleClose = () => {
    if ((window as any).electronAPI) {
      (window as any).electronAPI.closeWindow();
    }
  };

  return (
    <div 
      className="titlebar" 
      data-tauri-drag-region
      style={{
        height: '40px',
        background: 'var(--bg-app)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 12px',
        userSelect: 'none',
      }}
    >
      {/* Left: App Identity */}
      <div 
        className="titlebar-brand"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          flex: 1,
        }}
      >
        <img 
          src="/icon.png" 
          alt="Foundry"
          style={{ 
            width: '24px', 
            height: '24px', 
            borderRadius: '6px',
            objectFit: 'cover',
          }} 
        />
        <span 
          style={{
            fontSize: '15px',
            fontWeight: 700,
            color: 'var(--text-1)',
            fontFamily: 'var(--font-sans)',
            letterSpacing: '-0.01em',
          }}
        >
          {title}
        </span>
      </div>

      {/* Right: Window Controls */}
      <div 
        className="titlebar-controls"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
        }}
      >
        <IconButton
          icon={
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <path d="M5 12h14" />
            </svg>
          }
          ariaLabel="Minimize"
          tooltip="Minimize"
          onClick={handleMinimize}
          variant="ghost"
          size="sm"
        />
        <IconButton
          icon={
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="4" y="4" width="16" height="16" rx="2" />
            </svg>
          }
          ariaLabel="Maximize"
          tooltip="Maximize"
          onClick={handleMaximize}
          variant="ghost"
          size="sm"
        />
        <IconButton
          icon={
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          }
          ariaLabel="Close"
          tooltip="Close"
          onClick={handleClose}
          variant="ghost"
          size="sm"
          style={{
            '--hover-bg': 'var(--danger)',
            '--hover-text': 'var(--text-on-accent)',
          } as React.CSSProperties}
        />
      </div>
    </div>
  );
};
