import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { api } from '../services/api';
import { ModItem } from '../types';

interface ChangelogModalProps {
  modName: string;
  onClose: () => void;
}

export const ChangelogModal: React.FC<ChangelogModalProps> = ({ modName, onClose }) => {
  const [details, setDetails] = useState<ModItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    api.getModDetails(modName)
      .then((data) => {
        if (active) setDetails(data);
      })
      .catch((err) => console.error('Failed to get mod changelog:', err))
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [modName]);

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-6">
      <div
        className="w-full max-w-2xl rounded-lg border shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}
      >
        {/* Header */}
        <div
          className="px-6 py-4 border-b flex items-center justify-between"
          style={{ borderColor: 'var(--line)', background: 'var(--ink)' }}
        >
          <div>
            <h3 className="slab text-base font-semibold" style={{ color: 'var(--text)' }}>
              {details?.title || modName} — Changelog
            </h3>
            <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
              Release history and patch notes from the author
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-[var(--panel-2)] transition-colors"
            style={{ color: 'var(--text-faint)' }}
          >
            ✕
          </button>
        </div>

        {/* Changelog Content */}
        <div className="p-6 overflow-y-auto font-sans text-xs space-y-4">
          {loading ? (
            <div className="py-12 text-center" style={{ color: 'var(--text-faint)' }}>
              Loading changelog…
            </div>
          ) : details?.changelog ? (
            <pre
              className="mono text-xs whitespace-pre-wrap leading-relaxed p-4 rounded border"
              style={{
                background: 'var(--ink)',
                borderColor: 'var(--line-soft)',
                color: 'var(--text)',
              }}
            >
              {details.changelog}
            </pre>
          ) : details?.description ? (
            <div className="prose prose-invert max-w-none text-xs leading-relaxed">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {details.description}
              </ReactMarkdown>
            </div>
          ) : (
            <div className="py-12 text-center" style={{ color: 'var(--text-faint)' }}>
              No changelog recorded for this mod.
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="px-6 py-3 border-t flex justify-end"
          style={{ borderColor: 'var(--line)', background: 'var(--ink)' }}
        >
          <button className="btn text-xs px-4" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
