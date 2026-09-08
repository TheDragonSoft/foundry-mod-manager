import React from 'react';
import clsx from 'clsx';

export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  size?: 'sm' | 'md';
  disabled?: boolean;
  'aria-label'?: string;
  id?: string;
}

/**
 * Switch primitive per Spec §2
 * - accent when on, border-strong when off
 * - requires aria-label or <label> wrapper
 * - used for mod enable EVERYWHERE (fixes C1)
 */
export const Switch: React.FC<SwitchProps> = ({
  checked,
  onChange,
  size = 'md',
  disabled = false,
  'aria-label': ariaLabel,
  id,
}) => {
  const baseStyles = clsx(
    'relative inline-flex rounded-full transition-colors motion-fast',
    'focus-visible:outline-focus focus-visible:outline-offset-focus',
    size === 'sm' && 'w-7 h-4',
    size === 'md' && 'w-[34px] h-5',
    checked ? 'bg-accent-subtle border border-accent' : 'bg-bg-raised border border-border-strong',
    disabled && 'opacity-50 cursor-not-allowed'
  );

  const thumbStyles = clsx(
    'absolute top-px rounded-full transition-all motion-fast',
    size === 'sm' && 'h-3 w-3',
    size === 'md' && 'h-4 w-4',
    checked
      ? size === 'sm' 
        ? 'left-[14px] bg-accent shadow-[0_0_6px_rgba(232,150,74,0.4)]'
        : 'left-4 bg-accent shadow-[0_0_6px_rgba(232,150,74,0.4)]'
      : size === 'sm'
        ? 'left-0.5 bg-text-2'
        : 'left-0.5 bg-text-2'
  );

  return (
    <div
      className={baseStyles}
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={() => !disabled && onChange(!checked)}
      tabIndex={disabled ? undefined : 0}
      onKeyDown={(e) => {
        if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onChange(!checked);
        }
      }}
      id={id}
    >
      <span className={thumbStyles} />
    </div>
  );
};
