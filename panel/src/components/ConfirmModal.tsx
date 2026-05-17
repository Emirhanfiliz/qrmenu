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
        className="bg-surface border border-border rounded-2xl p-7 w-full max-w-sm flex flex-col gap-5"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="font-body text-snow text-sm leading-relaxed">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 border border-border text-silver font-body text-sm rounded-lg hover:bg-elevated transition-colors"
          >
            İptal
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-2.5 font-display font-semibold text-sm rounded-lg transition-colors ${
              danger
                ? 'bg-red-900/60 hover:bg-red-900/80 text-red-200 border border-red-800/40'
                : 'bg-gold hover:bg-gold-dim text-void'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
