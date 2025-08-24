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
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={clsx(
          'w-full px-3 py-2 border border-neutral-300 rounded-lg shadow-sm bg-white',
          'placeholder-neutral-600 text-neutral-900',
          'focus:outline-none focus:ring-2 focus:ring-sage-700 focus:border-sage-700 focus:bg-sage-200',
          'transition-colors duration-200',
          error && 'border-red-300 focus:ring-red-500 focus:border-red-500',
          props.disabled && 'bg-neutral-100 cursor-not-allowed',
          className
        )}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
      {hint && !error && (
        <p className="mt-1 text-sm text-neutral-600">{hint}</p>
      )}
    </div>
  );
};