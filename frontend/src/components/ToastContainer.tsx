import type { ToastItem } from '../hooks/useToast';

interface ToastContainerProps {
  toasts: ToastItem[];
  onDismiss: (id: number) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed top-16 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 w-full max-w-sm px-4 pointer-events-none"
      aria-live="polite"
    >
      {toasts.map((toast) => {
        const variantClasses =
          toast.variant === 'error'
            ? 'bg-red-950/95 border-red-500/50 text-red-100'
            : toast.variant === 'success'
              ? 'bg-[#3aa394] border-[#4ecdc4]/40 text-white'
              : 'bg-zinc-800/95 border-zinc-600/60 text-zinc-100';

        return (
          <div
            key={toast.id}
            onClick={() => onDismiss(toast.id)}
            className={`pointer-events-auto animate-toast-in cursor-pointer select-none rounded-lg border px-4 py-2.5 text-sm font-semibold shadow-xl backdrop-blur-md transition-transform active:scale-95 ${variantClasses}`}
            role="status"
          >
            {toast.message}
          </div>
        );
      })}
    </div>
  );
}
