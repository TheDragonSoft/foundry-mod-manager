import React from 'react';
import clsx from 'clsx';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: 'accent' | 'success' | 'warn' | 'danger' | 'neutral';
  variant?: 'subtle' | 'outline' | 'solid';
  size?: 'sm' | 'md' | string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Badge primitive per Spec §2
 * - Single source of truth for "Active", "Verified", "ok", "needs attention", counts
 * - Fixes C1/C7
 */
export const Badge: React.FC<BadgeProps> = ({
  tone = 'neutral',
  variant = 'subtle',
  size = 'md',
  children,
  className,
  ...rest
}) => {
  const baseStyles = clsx(
    'inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-xs font-medium whitespace-nowrap',
    // Tone colors
    tone === 'accent' && (
      variant === 'subtle' ? 'bg-accent-subtle text-accent' :
      variant === 'outline' ? 'border border-accent text-accent bg-transparent' :
      'bg-accent text-text-on-accent'
    ),
    tone === 'success' && (
      variant === 'subtle' ? 'bg-success-subtle text-success' :
      variant === 'outline' ? 'border border-success text-success bg-transparent' :
      'bg-success text-text-on-accent'
    ),
    tone === 'warn' && (
      variant === 'subtle' ? 'bg-warn-subtle text-warn' :
      variant === 'outline' ? 'border border-warn text-warn bg-transparent' :
      'bg-warn text-text-on-accent'
    ),
    tone === 'danger' && (
      variant === 'subtle' ? 'bg-danger-subtle text-danger' :
      variant === 'outline' ? 'border border-danger text-danger bg-transparent' :
      'bg-danger text-white'
    ),
    tone === 'neutral' && (
      variant === 'subtle' ? 'bg-bg-raised text-text-3' :
      variant === 'outline' ? 'border border-border-subtle text-text-2 bg-transparent' :
      'bg-bg-raised text-text-2'
    ),
    className
  );

  return <span className={baseStyles} {...rest}>{children}</span>;
};
