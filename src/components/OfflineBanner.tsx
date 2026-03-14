import React from 'react';
import { WifiOff } from 'lucide-react';

interface OfflineBannerProps {
  className?: string;
}

/**
 * Banner shown when the app is offline. Informs the user that some features
 * (e.g. AI chat, weather) may not work until connection is restored.
 */
export function OfflineBanner({ className = '' }: OfflineBannerProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex items-center justify-center gap-2 py-2 px-4 text-sm font-medium bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-200 border-b border-amber-200 dark:border-amber-800 ${className}`}
    >
      <WifiOff className="w-4 h-4 shrink-0" aria-hidden />
      <span>You're offline. Some features (e.g. AI Chat, Weather) won't work until you're back online.</span>
    </div>
  );
}
