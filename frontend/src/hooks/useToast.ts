import { useCallback, useRef, useState } from 'react';

export type ToastVariant = 'error' | 'success' | 'info';

export interface ToastItem {
  id: number;
  message: string;
  variant: ToastVariant;
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextIdRef = useRef(1);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, variant: ToastVariant = 'info', durationMs = 3200) => {
      const id = nextIdRef.current++;
      setToasts((prev) => {
        // Evita duplicar a mesma mensagem simultaneamente
        const filtered = prev.filter((t) => t.message !== message);
        return [...filtered.slice(-2), { id, message, variant }];
      });

      window.setTimeout(() => {
        dismissToast(id);
      }, durationMs);
    },
    [dismissToast]
  );

  return {
    toasts,
    showToast,
    dismissToast,
  };
}
