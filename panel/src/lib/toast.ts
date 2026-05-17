type ToastType = 'success' | 'error' | 'info';
type ToastFn = (message: string, type?: ToastType) => void;

let _fn: ToastFn | null = null;

export function initToast(fn: ToastFn) {
  _fn = fn;
}

export function toast(message: string, type: ToastType = 'success') {
  _fn?.(message, type);
}
