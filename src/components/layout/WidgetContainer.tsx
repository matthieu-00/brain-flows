import React, { Suspense } from 'react';
import { motion } from 'framer-motion';
import { X, Minimize2, Maximize2 } from 'lucide-react';
import { Widget } from '../../types';
import { useLayoutStore } from '../../store/layoutStore';
import { Button } from '../ui/Button';

// Lazy load widgets for better performance
const StickyNotesWidget = React.lazy(() => import('../widgets/StickyNotesWidget'));
const FlashcardWidget = React.lazy(() => import('../widgets/FlashcardWidget'));
const ChessWidget = React.lazy(() => import('../widgets/ChessWidget'));
const SudokuWidget = React.lazy(() => import('../widgets/SudokuWidget'));
const FidgetToolsWidget = React.lazy(() => import('../widgets/FidgetToolsWidget'));
const DrawingCanvasWidget = React.lazy(() => import('../widgets/DrawingCanvasWidget'));
const AIChatWidget = React.lazy(() => import('../widgets/AIChatWidget'));
const TimerWidget = React.lazy(() => import('../widgets/TimerWidget'));
const CalculatorWidget = React.lazy(() => import('../widgets/CalculatorWidget'));
const WeatherWidget = React.lazy(() => import('../widgets/WeatherWidget'));

interface WidgetContainerProps {
  widget: Widget;
  className?: string;
}

export const WidgetContainer: React.FC<WidgetContainerProps> = ({
  widget,
  className = '',
}) => {
  const { removeWidget, toggleWidgetCollapsed } = useLayoutStore();

  const renderWidget = () => {
    switch (widget.type) {
      case 'sticky-notes':
        return <StickyNotesWidget widget={widget} />;
      case 'flashcards':
        return <FlashcardWidget widget={widget} />;
      case 'chess':
        return <ChessWidget widget={widget} />;
      case 'sudoku':
        return <SudokuWidget widget={widget} />;
      case 'fidget-tools':
        return <FidgetToolsWidget widget={widget} />;
      case 'drawing-canvas':
        return <DrawingCanvasWidget widget={widget} />;
      case 'ai-chat':
        return <AIChatWidget widget={widget} />;
      case 'timer':
        return <TimerWidget widget={widget} />;
      case 'calculator':
        return <CalculatorWidget widget={widget} />;
      case 'weather':
        return <WeatherWidget widget={widget} />;
      default:
        return (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">❓</div>
            <p className="text-sm">Unknown widget type</p>
          </div>
        );
    }
  };

  const getWidgetDisplayName = () => {
    const names = {
      'sticky-notes': 'Sticky Notes',
      'flashcards': 'Flashcards',
      'chess': 'Chess Game',
      'sudoku': 'Sudoku',
      'fidget-tools': 'Fidget Tools',
      'drawing-canvas': 'Drawing Canvas',
      'ai-chat': 'AI Chat',
      'timer': 'Timer',
      'calculator': 'Calculator',
      'weather': 'Weather',
    };
    return names[widget.type] || 'Widget';
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`bg-white rounded-lg border border-neutral-300 shadow-sm overflow-hidden ${className}`}
      style={{
        minHeight: widget.isCollapsed ? '60px' : '300px',
        height: widget.isCollapsed ? '60px' : 'auto',
      }}
    >
      {/* Widget Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-cream-50 border-b border-neutral-300">
        <h3 className="text-sm font-semibold text-neutral-900">
          {getWidgetDisplayName()}
        </h3>
        
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleWidgetCollapsed(widget.id)}
            className="p-1.5 w-7 h-7 hover:bg-neutral-200"
            title={widget.isCollapsed ? 'Expand widget' : 'Collapse widget'}
          >
            {widget.isCollapsed ? (
              <Maximize2 className="w-3 h-3" />
            ) : (
              <Minimize2 className="w-3 h-3" />
            )}
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => removeWidget(widget.id)}
            className="p-1.5 w-7 h-7 text-red-600 hover:text-red-700 hover:bg-red-50"
            title="Remove widget"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Widget Content */}
      {!widget.isCollapsed && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="p-4"
        >
          <Suspense fallback={
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sage-900"></div>
              <span className="ml-3 text-sm text-neutral-600">Loading widget...</span>
            </div>
          }>
            {renderWidget()}
          </Suspense>
        </motion.div>
      )}
    </motion.div>
  );
};