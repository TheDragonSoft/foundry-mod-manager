import React from 'react';
import clsx from 'clsx';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  iconSize?: number;
  title: string;
  hint?: string;
  action?: React.ReactNode;
  className?: string;
}

/**
 * EmptyState primitive per Spec §2
 * - Compact empty state with icon, title, optional hint and action
 * - Fixes C5
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  iconSize = 36,
  title,
  hint,
  action,
  className,
}) => {
  const defaultIcon = (
    <svg 
      width={iconSize} 
      height={iconSize} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="1.5"
      className="text-text-3 opacity-70"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  );

  return (
    <div 
      className={clsx(
        'flex flex-col items-center justify-center text-center gap-3',
        'py-10 px-6',
        className
      )}
    >
      {icon || defaultIcon}
      <p className="text-body text-text-3 max-w-[26ch]">{title}</p>
      {hint && <p className="text-caption text-text-3">{hint}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
};
