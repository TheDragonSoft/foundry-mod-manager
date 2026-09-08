import React, { useState, useRef, useEffect } from 'react';
import clsx from 'clsx';

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: 'close' | 'refresh' | 'more' | 'search' | 'settings' | React.ReactNode;
  tooltip?: string;
  size?: 'sm' | 'md';
}

/**
 * IconButton primitive per Spec §2
 * - Requires tooltip + aria-label for accessibility (fixes C8)
 */
export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  children,
  tooltip,
  size = 'md',
  className,
  'aria-label': ariaLabel,
  ...props
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close tooltip on Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowTooltip(false);
    };
    if (showTooltip) {
      window.addEventListener('keydown', handleEscape);
      return () => window.removeEventListener('keydown', handleEscape);
    }
  }, [showTooltip]);

  const renderIcon = () => {
    if (children) return children;
    
    switch (icon) {
      case 'close':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        );
      case 'refresh':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
          </svg>
        );
      case 'more':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="1" />
            <circle cx="19" cy="12" r="1" />
            <circle cx="5" cy="12" r="1" />
          </svg>
        );
      case 'search':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
        );
      case 'settings':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        );
      default:
        return null;
    }
  };

  const baseStyles = clsx(
    'inline-flex items-center justify-center rounded-md transition-colors',
    'focus-visible:outline-focus focus-visible:outline-offset-focus',
    'text-text-2 hover:text-text-1 hover:bg-bg-hover',
    size === 'sm' && 'h-7 w-7 p-1',
    size === 'md' && 'h-9 w-9 p-2',
    props.disabled && 'opacity-50 cursor-not-allowed pointer-events-none'
  );

  return (
    <div className="relative inline-block">
      <button
        ref={buttonRef}
        className={clsx(baseStyles, className)}
        aria-label={ariaLabel || tooltip}
        title={tooltip}
        onMouseEnter={() => tooltip && setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onFocus={() => tooltip && setShowTooltip(true)}
        onBlur={() => setShowTooltip(false)}
        {...props}
      >
        {renderIcon()}
      </button>
      
      {showTooltip && tooltip && (
        <div 
          className="tooltip-popover"
          role="tooltip"
          style={{
            position: 'absolute',
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginBottom: '8px',
            padding: '6px 8px',
            backgroundColor: 'var(--bg-raised)',
            border: '1px solid var(--border-strong)',
            borderRadius: 'var(--r-sm)',
            fontSize: '12px',
            color: 'var(--text-1)',
            whiteSpace: 'nowrap',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            zIndex: 1000,
          }}
        >
          {tooltip}
        </div>
      )}
    </div>
  );
};
