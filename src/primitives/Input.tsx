import React from 'react';
import clsx from 'clsx';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: boolean;
}

/**
 * Input primitive per Spec §2
 * - h36 (md), bg-panel, border-subtle, r-md, text-1
 * - placeholder text-disabled, focus ring §1.9
 */
export const Input: React.FC<InputProps> = ({
  label,
  helperText,
  error = false,
  className,
  id,
  ...props
}) => {
  const inputId = id || `input-${Math.random().toString(36).slice(2)}`;
  
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label 
          htmlFor={inputId}
          className="text-caption font-semibold text-text-2"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={clsx(
          'h-md px-3 rounded-md border bg-bg-panel text-text-1',
          'border-border-subtle placeholder-text-disabled',
          'focus-visible:outline-focus focus-visible:outline-offset-focus',
          'transition-colors motion-fast',
          error && 'border-danger',
          className
        )}
        {...props}
      />
      {helperText && (
        <span className={clsx(
          'text-caption',
          error ? 'text-danger' : 'text-text-3'
        )}>
          {helperText}
        </span>
      )}
    </div>
  );
};
