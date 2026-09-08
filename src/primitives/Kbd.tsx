import React from 'react';
import clsx from 'clsx';

export interface KbdProps {
  keys?: string[];
  children?: React.ReactNode;
  className?: string;
}

/**
 * Kbd primitive per Spec §2
 * - For Ctrl+K and other keyboard hints
 * - Mono font, small size, bordered
 */
export const Kbd: React.FC<KbdProps> = ({ keys, children, className }) => {
  if (children) {
    return (
      <kbd
        className={clsx(
          'inline-flex items-center justify-center min-w-[1.5rem] h-5 px-1.5',
          'rounded-sm border border-border-subtle bg-bg-panel',
          'text-caption mono text-text-3',
          'shadow-sm',
          className
        )}
      >
        {children}
      </kbd>
    );
  }

  const keyList = keys || [];

  return (
    <div className={clsx('inline-flex items-center gap-1', className)}>
      {keyList.map((key, index) => (
        <React.Fragment key={index}>
          {index > 0 && <span className="text-text-3">+</span>}
          <kbd
            className={clsx(
              'inline-flex items-center justify-center min-w-[1.5rem] h-5 px-1.5',
              'rounded-sm border border-border-subtle bg-bg-panel',
              'text-caption mono text-text-3',
              'shadow-sm'
            )}
          >
            {key}
          </kbd>
        </React.Fragment>
      ))}
    </div>
  );
};
