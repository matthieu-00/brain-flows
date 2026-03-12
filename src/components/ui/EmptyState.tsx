import React from 'react';
import { clsx } from 'clsx';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className,
}) => (
  <div
    className={clsx(
      'flex flex-col items-center justify-center py-8 text-center',
      className,
    )}
  >
    {icon && (
      <div className="text-content-muted mb-3">{icon}</div>
    )}
    <p className="text-sm font-medium text-content-secondary">{title}</p>
    {description && (
      <p className="text-xs text-content-muted mt-1 max-w-[20rem]">{description}</p>
    )}
    {action && <div className="mt-4">{action}</div>}
  </div>
);
