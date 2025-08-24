import React from 'react';
import { Plus, Grid3X3 } from 'lucide-react';
import { Widget, WidgetType } from '../../types';
import { useLayoutStore } from '../../store/layoutStore';
import { Button } from '../ui/Button';

interface EmptyWidgetProps {
  widget: Widget;
}

const availableWidgets: { type: WidgetType; name: string; icon: React.ReactNode; description: string }[] = [
  { type: 'sticky-notes', name: 'Sticky Notes', icon: '📝', description: 'Quick notes and flashcards' },
  { type: 'flashcards', name: 'Flashcards', icon: '🃏', description: 'Study cards with flip animation' },
  { type: 'chess', name: 'Chess Game', icon: '♟️', description: 'Play chess with move history' },
  { type: 'sudoku', name: 'Sudoku', icon: '🧩', description: 'Brain training puzzles' },
  { type: 'fidget-tools', name: 'Fidget Tools', icon: '🎯', description: 'Stress relief tools' },
  { type: 'drawing-canvas', name: 'Drawing', icon: '🎨', description: 'Sketch and draw' },
  { type: 'ai-chat', name: 'AI Chat', icon: '🤖', description: 'Chat with AI assistant' },
  { type: 'timer', name: 'Pomodoro Timer', icon: '⏱️', description: 'Focus timer sessions' },
  { type: 'calculator', name: 'Calculator', icon: '🧮', description: 'Scientific calculator' },
  { type: 'weather', name: 'Weather', icon: '🌤️', description: 'Local weather info' },
];

export const EmptyWidget: React.FC<EmptyWidgetProps> = ({ widget }) => {
  const { updateWidget } = useLayoutStore();

  const handleSelectWidget = (type: WidgetType) => {
    updateWidget(widget.id, { type });
  };

  return (
    <div className="text-center py-8">
      <div className="mb-6">
        <Grid3X3 className="w-12 h-12 mx-auto text-neutral-600 mb-3" />
        <h3 className="text-lg font-medium text-neutral-900 mb-2">Choose a Widget</h3>
        <p className="text-sm text-neutral-600">
          Select a productivity tool to add to your workspace
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto">
        {availableWidgets.map((widgetOption) => (
          <Button
            key={widgetOption.type}
            variant="outline"
            onClick={() => handleSelectWidget(widgetOption.type)}
            className="p-3 h-auto flex flex-col items-center space-y-2 hover:bg-sage-100 hover:border-sage-700 transition-colors"
          >
            <div className="text-2xl">{widgetOption.icon}</div>
            <div className="text-center">
              <div className="font-medium text-sm">{widgetOption.name}</div>
              <div className="text-xs text-neutral-600 mt-1">
                {widgetOption.description}
              </div>
            </div>
          </Button>
        ))}
      </div>
    </div>
  );
};