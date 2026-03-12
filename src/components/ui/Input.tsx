import React from 'react';
import { clsx } from 'clsx';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  hint,
  className,
  id,
  ...props
}) => {
  const generatedId = React.useId();
  const inputId = id ?? generatedId;

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700 dark:text-neutral-textMuted mb-1"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={clsx(
          'w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-lg shadow-sm bg-white dark:bg-neutral-800',
          'placeholder-neutral-600 dark:placeholder-neutral-500 text-neutral-900 dark:text-neutral-text',
          'focus:outline-none focus:ring-2 focus:ring-sage-700 focus:border-sage-700 focus:bg-sage-200 dark:focus:bg-neutral-800',
          'transition-colors duration-200',
          error && 'border-red-300 focus:ring-red-500 focus:border-red-500',
          props.disabled && 'bg-neutral-100 dark:bg-neutral-800 cursor-not-allowed opacity-70',
          className
        )}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
      {hint && !error && (
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-textMuted">{hint}</p>
      )}
    </div>
  );
};