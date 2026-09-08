import React from 'react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: 'danger' | 'warning' | 'primary';
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = 'danger',
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        className="w-full max-w-md rounded-lg border shadow-2xl overflow-hidden"
        style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}
      >
        {/* Header */}
        <div
          className="px-5 py-3.5 border-b flex items-center justify-between"
          style={{ borderColor: 'var(--line)', background: 'var(--ink)' }}
        >
          <span className="slab text-sm font-semibold" style={{ color: 'var(--text)' }}>
            {title}
          </span>
          <button
            onClick={onCancel}
            className="p-1 rounded hover:bg-[var(--panel-2)] transition-colors"
            style={{ color: 'var(--text-faint)' }}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          <p className="text-xs leading-relaxed" style={{ color: 'var(--text-dim)' }}>
            {message}
          </p>
        </div>

        {/* Actions */}
        <div
          className="px-5 py-3 border-t flex items-center justify-end gap-2"
          style={{ borderColor: 'var(--line-soft)' }}
        >
          <button type="button" onClick={onCancel} className="btn text-xs px-3">
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={confirmVariant === 'danger' ? 'btn text-xs px-3' : 'btn btn-primary text-xs px-3'}
            style={
              confirmVariant === 'danger'
                ? {
                    background: 'var(--bad)',
                    borderColor: 'var(--bad)',
                    color: '#fff',
                  }
                : {}
            }
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
