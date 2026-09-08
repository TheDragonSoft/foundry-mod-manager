import React from 'react';
import { DownloadProgress } from '../types';

interface DownloadBarProps {
  downloads: DownloadProgress[];
  onDismiss: (key: string) => void;
}

export const DownloadBar: React.FC<DownloadBarProps> = ({ downloads, onDismiss }) => {
  if (downloads.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full">
      {downloads.map((d) => {
        const key = `${d.modName}@${d.version}`;
        const isError = d.status === 'error';
        const isComplete = d.status === 'completed';
        const isDownloading = d.status === 'downloading';

        return (
          <div
            key={key}
            className="p-3 rounded-lg border shadow-xl transition-all"
            style={{
              background: isError ? 'var(--bad-bg)' : 'var(--panel)',
              borderColor: isError ? 'var(--bad)' : isComplete ? 'var(--good)' : 'var(--line)',
            }}
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2 truncate">
                <span
                  className="font-semibold text-xs truncate"
                  style={{ color: isError ? 'var(--bad)' : 'var(--text)' }}
                >
                  {d.title}
                </span>
                <span className="mono text-[11px]" style={{ color: 'var(--text-faint)' }}>
                  v{d.version}
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="mono text-[11px]" style={{ color: 'var(--text-dim)' }}>
                  {isDownloading ? d.speed : isComplete ? 'Ready' : 'Failed'}
                </span>
                <button
                  onClick={() => onDismiss(key)}
                  className="p-0.5 rounded hover:bg-[var(--panel-2)] transition-colors"
                  style={{ color: 'var(--text-faint)' }}
                  title="Dismiss"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Progress bar */}
            {isDownloading && (
              <div
                className="w-full rounded-full h-1.5 overflow-hidden mt-1.5"
                style={{ background: 'var(--raised)' }}
              >
                <div
                  className="h-full transition-all duration-200"
                  style={{ width: `${d.progress}%`, background: 'var(--copper)' }}
                />
              </div>
            )}

            {isError && d.error && (
              <div className="text-[11px] mt-1 truncate" style={{ color: 'var(--bad)' }} title={d.error}>
                {d.error}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
