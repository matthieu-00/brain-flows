import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useToastStore } from '../../store/toastStore';
import { Button } from './Button';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToastStore();

  return (
    <div
      className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm pointer-events-none"
      aria-live="polite"
      aria-label="Notifications"
    >
      <div className="pointer-events-auto flex flex-col gap-2">
        <AnimatePresence>
          {toasts.map((toast) => (
            <ToastItem key={toast.id} toast={toast} onDismiss={() => removeToast(toast.id)} />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

const variantStyles: Record<string, string> = {
  default: 'bg-neutral-800 dark:bg-neutral-700 text-white border-neutral-700',
  success: 'bg-green-800 dark:bg-green-900/90 text-white border-green-700',
  error: 'bg-red-800 dark:bg-red-900/90 text-white border-red-700',
  info: 'bg-sage-800 dark:bg-sage-900/90 text-white border-sage-700',
};

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: { id: string; message: string; variant: string };
  onDismiss: () => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.96 }}
      className={`rounded-lg border px-3 py-2.5 text-sm shadow-lg ${variantStyles[toast.variant] ?? variantStyles.default}`}
    >
      <div className="flex items-start gap-2">
        <p className="flex-1 pt-0.5">{toast.message}</p>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDismiss}
          className="!p-1 -mr-1 shrink-0 text-white/80 hover:text-white hover:!bg-white/10"
          aria-label="Dismiss"
        >
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>
    </motion.div>
  );
}
