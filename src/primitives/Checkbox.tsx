import React from 'react';
import clsx from 'clsx';

export interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  id?: string;
  'aria-label'?: string;
}

/**
 * Checkbox primitive per Spec §2
 * - Custom square r-sm, accent check
 * - Used in settings modal
 */
export const Checkbox: React.FC<CheckboxProps> = ({
  checked,
  onChange,
  label,
  disabled = false,
  id,
  'aria-label': ariaLabel,
}) => {
  const checkboxId = id || `checkbox-${Math.random().toString(36).slice(2)}`;

  return (
    <label 
      className={clsx(
        'inline-flex items-center gap-3 cursor-pointer',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      <div
        role="checkbox"
        aria-checked={checked}
        aria-label={ariaLabel || label}
        tabIndex={disabled ? undefined : 0}
        className={clsx(
          'w-4 h-4 rounded-sm border flex items-center justify-center',
          'transition-colors motion-fast',
          'focus-visible:outline-focus focus-visible:outline-offset-focus',
          checked 
            ? 'bg-accent border-accent' 
            : 'bg-bg-panel border-border-subtle hover:border-border-strong',
          disabled && 'opacity-50'
        )}
        onClick={() => !disabled && onChange(!checked)}
        onKeyDown={(e) => {
          if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            onChange(!checked);
          }
        }}
      >
        {checked && (
          <svg 
            width="12" 
            height="12" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="3"
            className="text-text-on-accent"
          >
            <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
      {label && (
        <span className={clsx(
          'text-body',
          disabled ? 'text-text-disabled' : 'text-text-1'
        )}>
          {label}
        </span>
      )}
    </label>
  );
};
