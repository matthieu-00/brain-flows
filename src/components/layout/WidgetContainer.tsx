import React, { Suspense } from 'react';
import { motion } from 'framer-motion';
import { X, Minimize2, Maximize2 } from 'lucide-react';
import { Widget } from '../../types';
import { useLayoutStore } from '../../store/layoutStore';
import { Button } from '../ui/Button';
import { EmptyWidget } from '../widgets/EmptyWidget';

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
      case 'empty':
      default:
        return <EmptyWidget widget={widget} />;
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden ${className}`}
      className={`bg-white rounded-lg border border-neutral-300 shadow-sm overflow-hidden ${className}`}
      style={{
        minHeight: widget.isCollapsed ? '50px' : '200px',
        height: widget.isCollapsed ? '50px' : 'auto',
      }}
    >
      {/* Widget Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-cream-100 border-b border-neutral-300">
        <h3 className="text-sm font-medium text-neutral-900 capitalize">
          {widget.type.replace('-', ' ')}
        </h3>
        
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleWidgetCollapsed(widget.id)}
            className="p-1 w-6 h-6"
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
            className="p-1 w-6 h-6 text-red-600 hover:text-red-700"
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
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sage-900"></div>
              <span className="ml-2 text-sm text-neutral-600">Loading widget...</span>
            </div>
          }>
            {renderWidget()}
          </Suspense>
        </motion.div>
      )}
    </motion.div>
  );
};