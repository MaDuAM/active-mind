// frontend/src/components/ConfirmDialog.tsx

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isPending?: boolean;
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Leave',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  isPending = false,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="bg-[var(--bg-card)] rounded-card shadow-card p-6 max-w-sm w-full border border-[var(--border-color)]">
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">{title}</h3>
        <p className="text-sm text-[var(--text-secondary)] mt-2">{message}</p>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onCancel} className="btn-secondary text-sm px-3 py-1.5" disabled={isPending}>
            {cancelLabel}
          </button>
          <button onClick={onConfirm} disabled={isPending} className="btn-danger text-sm px-3 py-1.5">
            {isPending ? '...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}