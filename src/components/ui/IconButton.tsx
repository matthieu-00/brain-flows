import React from 'react';
import { clsx } from 'clsx';

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'ghost' | 'outline' | 'danger';
  size?: 'sm' | 'md';
  label: string;
  children: React.ReactNode;
}

const variantClasses = {
  ghost:
    'text-content-secondary hover:text-content-primary hover:bg-surface-hover focus-visible:ring-2 focus-visible:ring-accent',
  outline:
    'border border-edge text-content-secondary hover:text-content-primary hover:border-accent focus-visible:ring-2 focus-visible:ring-accent',
  danger:
    'text-danger hover:bg-danger-subtle focus-visible:ring-2 focus-visible:ring-danger',
};

const sizeClasses = {
  sm: 'w-7 h-7',
  md: 'w-9 h-9',
};

export const IconButton: React.FC<IconButtonProps> = ({
  variant = 'ghost',
  size = 'sm',
  label,
  className,
  children,
  ...props
}) => (
  <button
    type="button"
    aria-label={label}
    title={label}
    className={clsx(
      'inline-flex items-center justify-center rounded-token-md transition-colors duration-fast focus:outline-none',
      variantClasses[variant],
      sizeClasses[size],
      props.disabled && 'opacity-50 cursor-not-allowed',
      className,
    )}
    {...props}
  >
    {children}
  </button>
);
