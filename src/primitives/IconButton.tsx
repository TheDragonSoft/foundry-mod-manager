import React from 'react';
import clsx from 'clsx';

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  tooltip?: string;
  size?: 'sm' | 'md';
}

/**
 * IconButton primitive per Spec §2
 * - Requires tooltip + aria-label for accessibility (fixes C8)
 */
export const IconButton: React.FC<IconButtonProps> = ({
  children,
  tooltip,
  size = 'md',
  className,
  'aria-label': ariaLabel,
  ...props
}) => {
  const baseStyles = clsx(
    'inline-flex items-center justify-center rounded-md transition-colors motion-fast',
    'focus-visible:outline-focus focus-visible:outline-offset-focus',
    'text-text-2 hover:text-text-1 hover:bg-bg-hover',
    size === 'sm' && 'h-sm w-sm p-1.5',
    size === 'md' && 'h-md w-md p-2',
    props.disabled && 'opacity-50 cursor-not-allowed pointer-events-none'
  );

  return (
    <button
      className={clsx(baseStyles, className)}
      aria-label={ariaLabel || tooltip}
      title={tooltip}
      {...props}
    >
      {children}
    </button>
  );
};
