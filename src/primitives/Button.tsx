import React from 'react';
import clsx from 'clsx';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md';
  children: React.ReactNode;
}

/**
 * Button primitive per Spec §2
 * - primary: accent fill (ONE per screen max)
 * - secondary: bg-raised + border-strong, text-1
 * - ghost: transparent, text-2, bg-hover on hover
 * - danger: danger semantic color
 */
export const Button: React.FC<ButtonProps> = ({
  variant = 'secondary',
  size = 'md',
  className,
  children,
  ...props
}) => {
  const baseStyles = clsx(
    'inline-flex items-center justify-center gap-2 font-semibold rounded-md transition-colors motion-fast',
    'focus-visible:outline-focus focus-visible:outline-offset-focus',
    size === 'sm' && 'h-sm px-3 text-xs',
    size === 'md' && 'h-md px-4 text-sm',
    variant === 'primary' && 'bg-accent text-text-on-accent hover:bg-accent-hover active:bg-accent-pressed',
    variant === 'secondary' && 'bg-bg-raised border border-border-strong text-text-1 hover:bg-bg-hover',
    variant === 'ghost' && 'bg-transparent text-text-2 hover:bg-bg-hover',
    variant === 'danger' && 'bg-danger-subtle border border-danger text-danger hover:bg-danger',
    props.disabled && 'opacity-50 cursor-not-allowed pointer-events-none'
  );

  return (
    <button className={clsx(baseStyles, className)} {...props}>
      {children}
    </button>
  );
};
