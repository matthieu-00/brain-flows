import React, { useEffect } from 'react';
import { useAuthStore } from './store/authStore';
import { useDocumentStore } from './store/documentStore';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import LandingPage from './components/landing/LandingPage';
import { Header } from './components/layout/Header';
import { MainLayout } from './components/layout/MainLayout';
import { WidgetManagementModal } from './components/modals/WidgetManagementModal';

function App() {
  const { isAuthenticated } = useAuthStore();
  const { currentDocument, createDocument } = useDocumentStore();
  
  // Enable keyboard shortcuts
  useKeyboardShortcuts();

  // Create initial document if none exists
  useEffect(() => {
    if (isAuthenticated && !currentDocument) {
      createDocument('Welcome to WriteSpace');
    }
  }, [isAuthenticated, currentDocument, createDocument]);

  // Apply theme class to document
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark');
    
    // Theme handling would go here in a full implementation
  }, []);

  if (!isAuthenticated) {
    return <LandingPage />;
  }

  return (
    <div className="min-h-screen bg-cream-50">
      <Header />
      <MainLayout />
      <WidgetManagementModal />
    </div>
  );
}

export default App;