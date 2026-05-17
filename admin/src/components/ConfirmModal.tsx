type Props = {
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmModal({ message, confirmLabel = 'Evet, devam et', danger = true, onConfirm, onCancel }: Props) {
  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={onCancel}>
      <div
        className="bg-surface border border-border rounded-xl p-6 w-full max-w-sm flex flex-col gap-5"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="font-mono text-bright text-sm leading-relaxed">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2 border border-border text-dim font-mono text-xs rounded-lg hover:text-bright transition-colors"
          >
            iptal
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-2 font-mono text-xs rounded-lg transition-colors border ${
              danger
                ? 'text-danger border-danger/30 hover:bg-danger/10'
                : 'text-emerge border-emerge/30 hover:bg-emerge/10'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
