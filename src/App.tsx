import React, { useEffect } from 'react';
import { useAuthStore } from './store/authStore';
import { useDocumentStore } from './store/documentStore';
import { useLayoutStore } from './store/layoutStore';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import LandingPage from './components/landing/LandingPage';
import { Header } from './components/layout/Header';
import { MainLayout } from './components/layout/MainLayout';
import { OfflineBanner } from './components/OfflineBanner';
import { WidgetManagementModal } from './components/modals/WidgetManagementModal';
import { AgentChatModal } from './components/agent/AgentChatModal';
import { ToastContainer } from './components/ui/Toast';

// Returns true if the hex color is dark (low luminance, unreadable on dark bg)
function isDarkColor(hex: string): boolean {
  const match = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (!match) return true; // treat invalid as dark
  const r = parseInt(match[1], 16) / 255;
  const g = parseInt(match[2], 16) / 255;
  const b = parseInt(match[3], 16) / 255;
  const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
  return luminance < 0.4;
}

function App() {
  const { isAuthenticated } = useAuthStore();
  const { currentDocument, createDocument } = useDocumentStore();
  const { settings, updateSettings } = useLayoutStore();
  const isOnline = useOnlineStatus();

  // Enable keyboard shortcuts
  useKeyboardShortcuts();

  // Create initial document if none exists
  useEffect(() => {
    if (isAuthenticated && !currentDocument) {
      createDocument('Welcome to brainsflow.io');
    }
  }, [isAuthenticated, currentDocument, createDocument]);

  // Apply theme class to document (only when authenticated)
  useEffect(() => {
    const root = document.documentElement;
    if (!isAuthenticated) {
      root.classList.remove('dark');
      return;
    }

    const applyTheme = (theme: 'light' | 'dark' | 'system') => {
      let isDark = false;
      if (theme === 'dark') {
        root.classList.add('dark');
        isDark = true;
      } else if (theme === 'light') {
        root.classList.remove('dark');
      } else {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDark) {
          root.classList.add('dark');
          isDark = true;
        } else {
          root.classList.remove('dark');
        }
      }
      // Ensure editor text color matches theme: dark text for light mode, light text for dark mode
      const currentColor = settings.editorTextColor || '#2c2c2c';
      if (isDark) {
        if (isDarkColor(currentColor)) {
          updateSettings({ editorTextColor: '#F5F5F6' });
        }
      } else {
        if (!isDarkColor(currentColor)) {
          updateSettings({ editorTextColor: '#2c2c2c' });
        }
      }
    };

    applyTheme(settings.theme);

    if (settings.theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = () => applyTheme('system');
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    }
  }, [isAuthenticated, settings.theme]);

  if (!isAuthenticated) {
    return <LandingPage />;
  }

  return (
    <div className="min-h-screen bg-cream-50 dark:bg-neutral-950">
      {!isOnline && <OfflineBanner />}
      <Header />
      <MainLayout />
      <WidgetManagementModal />
      <AgentChatModal />
      <ToastContainer />
    </div>
  );
}

export default App;