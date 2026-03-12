import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';

interface CollapsibleSectionProps {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  defaultOpen = true,
  children,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={clsx('border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden', className)}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between px-4 py-3 text-left bg-neutral-50 dark:bg-neutral-surface hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors focus:outline-none focus:ring-2 focus:ring-sage-700 focus:ring-inset"
      >
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-text">{title}</h3>
        {isOpen ? (
          <ChevronDown className="w-5 h-5 text-neutral-600 dark:text-neutral-400 flex-shrink-0" />
        ) : (
          <ChevronRight className="w-5 h-5 text-neutral-600 dark:text-neutral-400 flex-shrink-0" />
        )}
      </button>
      {isOpen && <div className="p-4 bg-white dark:bg-neutral-800 space-y-3">{children}</div>}
    </div>
  );
};
