import React, { useState, useRef, useEffect } from 'react';
import clsx from 'clsx';

export interface SelectOption {
  value: string | number;
  label: string;
}

export type SelectOptionItem = SelectOption | string;

export interface SelectProps {
  options: SelectOptionItem[];
  value?: string | number;
  onChange?: (value: any) => void;
  placeholder?: string;
  label?: string;
  helperText?: string;
  disabled?: boolean;
  className?: string;
  'aria-label'?: string;
}

/**
 * Select primitive per Spec §2
 * - CUSTOM listbox (button + popover list, keyboard navigable, typeahead)
 * - Replaces ALL native <select> (fixes C2)
 */
export const Select: React.FC<SelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  label,
  helperText,
  disabled = false,
  className,
  'aria-label': ariaLabel,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const normalizedOptions: SelectOption[] = options.map((opt) =>
    typeof opt === 'string' ? { value: opt, label: opt } : opt
  );

  const selectedOption = normalizedOptions.find((opt) => opt.value === value);
  const displayedValue = selectedOption?.label || placeholder;

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        buttonRef.current?.focus();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightedIndex((prev) => Math.min(prev + 1, normalizedOptions.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const option = normalizedOptions[highlightedIndex];
        if (option) {
          onChange?.(option.value);
          setIsOpen(false);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, highlightedIndex, normalizedOptions, onChange]);

  const handleSelect = (option: SelectOption) => {
    onChange?.(option.value);
    setIsOpen(false);
    buttonRef.current?.focus();
  };

  return (
    <div ref={containerRef} className={clsx('relative inline-block text-left', className)}>
      {label && (
        <label className="block text-caption font-semibold text-text-2 mb-1">
          {label}
        </label>
      )}
      
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={clsx(
          'inline-flex items-center justify-between gap-2 w-full h-md px-3 rounded-md border',
          'bg-bg-panel border-border-subtle text-text-1',
          'hover:border-border-strong hover:bg-bg-hover',
          'focus-visible:outline-focus focus-visible:outline-offset-focus',
          'transition-colors motion-fast',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span className="truncate">{displayedValue}</span>
        <svg 
          width="16" 
          height="16" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2"
          className={clsx('transition-transform motion-fast', isOpen && 'rotate-180')}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {isOpen && (
        <ul
          ref={listRef}
          role="listbox"
          className={clsx(
            'absolute z-50 mt-1 w-full max-h-60 overflow-y-auto',
            'bg-bg-raised border border-border-strong rounded-md shadow-lg',
            'scrollbar-stable'
          )}
        >
          {normalizedOptions.map((option, index) => (
            <li
              key={option.value}
              role="option"
              aria-selected={option.value === value}
              className={clsx(
                'px-3 py-2 text-sm cursor-pointer transition-colors motion-fast',
                'text-text-1',
                index === highlightedIndex && 'bg-bg-hover',
                option.value === value && 'bg-accent-subtle text-accent font-semibold',
                'hover:bg-bg-hover'
              )}
              onMouseEnter={() => setHighlightedIndex(index)}
              onClick={() => handleSelect(option)}
            >
              {option.label}
            </li>
          ))}
        </ul>
      )}

      {helperText && (
        <p className="text-caption text-text-3 mt-1">{helperText}</p>
      )}
    </div>
  );
};
