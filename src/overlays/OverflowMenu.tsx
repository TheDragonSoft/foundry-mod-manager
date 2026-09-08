import React, { useRef, useEffect } from 'react';

interface MenuItem {
  id: string;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  separator?: boolean;
}

interface OverflowMenuProps {
  items: MenuItem[];
  onClose: () => void;
  anchorRef?: React.RefObject<HTMLElement>;
}

export const OverflowMenu: React.FC<OverflowMenuProps> = ({
  items,
  onClose,
  anchorRef,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        anchorRef?.current &&
        !anchorRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose, anchorRef]);

  // Close on Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Keyboard navigation
  useEffect(() => {
    const menuElement = menuRef.current;
    if (!menuElement) return;

    const focusableItems = menuElement.querySelectorAll<HTMLElement>(
      '[role="menuitem"]:not([disabled])'
    );
    let currentIndex = 0;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        currentIndex = (currentIndex + 1) % focusableItems.length;
        focusableItems[currentIndex]?.focus();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        currentIndex = (currentIndex - 1 + focusableItems.length) % focusableItems.length;
        focusableItems[currentIndex]?.focus();
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        focusableItems[currentIndex]?.click();
      }
    };

    menuElement.addEventListener('keydown', handleKeyDown);
    return () => menuElement.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div
      ref={menuRef}
      role="menu"
      className="absolute z-50 w-[220px] rounded-lg border shadow-lg overflow-hidden py-1"
      style={{
        background: 'var(--bg-raised)',
        borderColor: 'var(--border-strong)',
        boxShadow: '0 12px 32px rgba(0,0,0,.45)',
      }}
    >
      {items.map((item) => {
        if (item.separator) {
          return (
            <div
              key={`sep-${item.id}`}
              className="my-1 border-t"
              style={{ borderColor: 'var(--border-subtle)' }}
            />
          );
        }

        return (
          <button
            key={item.id}
            role="menuitem"
            disabled={item.disabled}
            onClick={() => {
              item.onClick();
              onClose();
            }}
            className="w-full px-3 py-2 text-left text-sm hover:bg-[var(--bg-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ color: item.disabled ? 'var(--text-disabled)' : 'var(--text-1)' }}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
};
