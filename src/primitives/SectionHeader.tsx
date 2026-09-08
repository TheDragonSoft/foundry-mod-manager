import React from 'react';
import { Badge } from './Badge';

interface SectionHeaderProps {
  overline?: string;
  title: string;
  description?: string;
  status?: React.ReactNode;
  className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  overline,
  title,
  description,
  status,
  className = '',
}) => {
  return (
    <div className={`mb-6 ${className}`}>
      {overline && (
        <div className="text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-3)' }}>
          {overline}
        </div>
      )}
      <div className="flex items-center gap-3">
        <h2 className="text-[20px] font-semibold" style={{ color: 'var(--text-1)' }}>
          {title}
        </h2>
        {status && <div>{status}</div>}
      </div>
      {description && (
        <p className="text-sm mt-1" style={{ color: 'var(--text-2)' }}>
          {description}
        </p>
      )}
    </div>
  );
};
