import React from 'react';
import clsx from 'clsx';

export interface ChipProps {
  label: string;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}

/**
 * Chip primitive per Spec §2
 * - Toggleable filter tags
 * - off = bg-panel/border-subtle/text-2
 * - on = accent-subtle bg + accent text + accent border
 */
export const Chip: React.FC<ChipProps> = ({
  label,
  active = false,
  onClick,
  className,
}) => {
  return (
    <button
      className={clsx(
        'inline-flex items-center px-2.5 py-1 rounded-sm text-xs font-medium',
        'transition-colors motion-fast',
        'focus-visible:outline-focus focus-visible:outline-offset-focus',
        active
          ? 'bg-accent-subtle text-accent border border-accent'
          : 'bg-bg-panel border border-border-subtle text-text-2 hover:border-accent-dim hover:text-text-1',
        className
      )}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
};
