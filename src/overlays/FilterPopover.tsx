import React, { useState, useRef, useEffect } from 'react';
import { Checkbox } from '../../primitives/Checkbox';
import { Input } from '../../primitives/Input';
import { Button } from '../../primitives/Button';
import { Badge } from '../../primitives/Badge';

interface FilterPopoverProps {
  allTags: string[];
  appliedTags: string[];
  onApplyTags: (tags: string[]) => void;
  onClose: () => void;
  anchorRef?: React.RefObject<HTMLElement>;
}

export const FilterPopover: React.FC<FilterPopoverProps> = ({
  allTags,
  appliedTags,
  onApplyTags,
  onClose,
  anchorRef,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set(appliedTags));
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
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

  const filteredTags = allTags.filter((tag) =>
    tag.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggleTag = (tag: string) => {
    setSelectedTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) {
        next.delete(tag);
      } else {
        next.add(tag);
      }
      return next;
    });
  };

  const handleClearAll = () => {
    setSelectedTags(new Set());
  };

  const handleApply = () => {
    onApplyTags(Array.from(selectedTags));
    onClose();
  };

  return (
    <div
      ref={popoverRef}
      className="absolute z-50 w-[280px] rounded-lg border shadow-lg overflow-hidden"
      style={{
        background: 'var(--bg-raised)',
        borderColor: 'var(--border-strong)',
        boxShadow: '0 12px 32px rgba(0,0,0,.45)',
      }}
    >
      {/* Search */}
      <div className="p-3 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
        <Input
          placeholder="Search tags…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full text-sm"
          autoFocus
        />
      </div>

      {/* Tag List */}
      <div className="max-h-[300px] overflow-y-auto p-2">
        {filteredTags.length === 0 ? (
          <div className="p-4 text-center text-xs" style={{ color: 'var(--text-3)' }}>
            No tags found
          </div>
        ) : (
          filteredTags.map((tag) => (
            <label
              key={tag}
              className="flex items-center gap-3 px-2 py-2 rounded cursor-pointer hover:bg-[var(--bg-hover)] transition-colors"
            >
              <Checkbox
                checked={selectedTags.has(tag)}
                onChange={() => handleToggleTag(tag)}
              />
              <span className="text-sm" style={{ color: 'var(--text-1)' }}>
                {tag}
              </span>
            </label>
          ))
        )}
      </div>

      {/* Footer */}
      <div
        className="px-3 py-2 border-t flex items-center justify-between"
        style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-panel)' }}
      >
        <Button variant="ghost" size="sm" onClick={handleClearAll}>
          Clear all
        </Button>
        <div className="flex items-center gap-2">
          <Badge tone="neutral" variant="subtle">
            {selectedTags.size} selected
          </Badge>
          <Button variant="primary" size="sm" onClick={handleApply}>
            Apply
          </Button>
        </div>
      </div>
    </div>
  );
};
