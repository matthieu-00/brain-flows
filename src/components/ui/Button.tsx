import React from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  className,
  children,
  disabled,
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-neutral-950';
  
  const variantClasses = {
    primary: 'bg-sage-900 dark:bg-sage-600 text-white hover:bg-sage-700 dark:hover:bg-sage-500 focus:ring-sage-700 dark:focus:ring-sage-500 shadow-sm',
    secondary: 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-text hover:bg-neutral-300 dark:hover:bg-neutral-700 focus:ring-sage-700 dark:focus:ring-sage-500 shadow-sm',
    outline: 'border-2 border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-text hover:border-sage-700 hover:bg-sage-100 dark:hover:bg-neutral-800 focus:ring-sage-700 dark:focus:ring-sage-500',
    ghost: 'text-neutral-600 dark:text-neutral-textMuted hover:text-neutral-900 dark:hover:text-neutral-text hover:bg-sage-100 dark:hover:bg-neutral-800 focus:ring-sage-700 dark:focus:ring-sage-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-sm',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  const isDisabled = disabled || isLoading;
  const hasScale = variant === 'primary' || variant === 'danger';

  return (
    <motion.button
      whileHover={!isDisabled && hasScale ? { scale: 1.02 } : undefined}
      whileTap={!isDisabled && hasScale ? { scale: 0.98 } : undefined}
      className={clsx(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        isDisabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      disabled={isDisabled}
      {...props}
    >
      {isLoading && (
        <svg
          className="w-4 h-4 mr-2 animate-spin"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </motion.button>
  );
};