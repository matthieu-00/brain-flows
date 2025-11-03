import { useEffect } from 'react';
import { useLayoutStore } from '../store/layoutStore';
import { useDocumentStore } from '../store/documentStore';
import { useUIStore } from '../store/uiStore';

export const useKeyboardShortcuts = () => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Ctrl/Cmd key combinations
      const isCtrlCmd = e.ctrlKey || e.metaKey;
      const isAlt = e.altKey;
      
      if (isCtrlCmd) {
        switch (e.key) {
          case 's':
            // Ctrl/Cmd + S: Save document
            e.preventDefault();
            useDocumentStore.getState().saveDocument();
            break;
            
          case 'e':
            // Ctrl/Cmd + E: Export document
            e.preventDefault();
            useDocumentStore.getState().exportDocument('pdf');
            break;
            
          case 'Enter':
            // Ctrl/Cmd + Enter: Toggle distraction-free mode
            if (e.shiftKey) {
              e.preventDefault();
              useLayoutStore.getState().toggleDistractionFreeMode();
            }
            break;
            
          default:
            break;
        }
      }
      
      // Alt key combinations for widget management
      if (isAlt) {
        switch (e.key) {
          case '+':
          case '=': // Handle both + and = keys (since + requires shift)
            e.preventDefault();
            useUIStore.getState().openWidgetModal('add');
            break;
            
          case '-':
            e.preventDefault();
            useUIStore.getState().openWidgetModal('remove');
            break;
            
          default:
            break;
        }
      }
      
      // Escape key: Exit distraction-free mode
      if (e.key === 'Escape') {
        const { distractionFreeMode, toggleDistractionFreeMode } = useLayoutStore.getState();
        if (distractionFreeMode) {
          toggleDistractionFreeMode();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []); // Empty dependency array - we use getState() to avoid re-subscriptions
};