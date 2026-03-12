import React from 'react';
import { clsx } from 'clsx';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'interactive';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

const paddingClasses = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

const variantClasses = {
  default:
    'bg-surface border border-edge rounded-token-lg shadow-token-sm',
  elevated:
    'bg-surface-elevated border border-edge rounded-token-lg shadow-token-md',
  interactive:
    'bg-surface border border-edge rounded-token-lg shadow-token-sm hover:shadow-token-md hover:border-accent transition-all duration-normal cursor-pointer',
};

export const Card: React.FC<CardProps> = ({
  variant = 'default',
  padding = 'md',
  className,
  children,
  ...props
}) => (
  <div
    className={clsx(variantClasses[variant], paddingClasses[padding], className)}
    {...props}
  >
    {children}
  </div>
);
