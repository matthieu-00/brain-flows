import { useEffect } from 'react';
import { useLayoutStore } from '../store/layoutStore';
import { useDocumentStore } from '../store/documentStore';

export const useKeyboardShortcuts = () => {
  const { toggleDistractionFreeMode } = useLayoutStore();
  const { saveDocument, exportDocument } = useDocumentStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Ctrl/Cmd key combinations
      const isCtrlCmd = e.ctrlKey || e.metaKey;
      
      if (isCtrlCmd) {
        switch (e.key) {
          case 's':
            // Ctrl/Cmd + S: Save document
            e.preventDefault();
            saveDocument();
            break;
            
          case 'e':
            // Ctrl/Cmd + E: Export document
            e.preventDefault();
            exportDocument('pdf');
            break;
            
          case 'Enter':
            // Ctrl/Cmd + Enter: Toggle distraction-free mode
            if (e.shiftKey) {
              e.preventDefault();
              toggleDistractionFreeMode();
            }
            break;
            
          default:
            break;
        }
      }
      
      // Escape key: Exit distraction-free mode
      if (e.key === 'Escape') {
        const { distractionFreeMode } = useLayoutStore.getState();
        if (distractionFreeMode) {
          toggleDistractionFreeMode();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [toggleDistractionFreeMode, saveDocument, exportDocument]);
};