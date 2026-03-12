import React from 'react';
import { clsx } from 'clsx';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';

interface InlineAlertProps {
  variant?: 'error' | 'success' | 'info';
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}

const styles = {
  error: {
    container: 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400',
    Icon: AlertCircle,
  },
  success: {
    container: 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400',
    Icon: CheckCircle2,
  },
  info: {
    container: 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400',
    Icon: Info,
  },
};

export const InlineAlert: React.FC<InlineAlertProps> = ({
  variant = 'info',
  children,
  className,
  action,
}) => {
  const { container, Icon } = styles[variant];
  return (
    <div
      role="alert"
      className={clsx(
        'flex items-start gap-2 rounded-token-md border p-3 text-sm',
        container,
        className,
      )}
    >
      <Icon className="w-4 h-4 mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">{children}</div>
      {action}
    </div>
  );
};
