import { toast as sonner } from 'sonner';

type ToastType = 'success' | 'error' | 'info';

export function toast(message: string, type: ToastType = 'success') {
  if (type === 'success') sonner.success(message);
  else if (type === 'error') sonner.error(message);
  else sonner(message);
}
