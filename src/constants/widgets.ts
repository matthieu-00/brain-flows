import type { WidgetType, WidgetZone } from '../types';

export const widgetConfig: {
  type: WidgetType;
  name: string;
  description: string;
  icon: string;
  apiKeyType?: 'openai' | 'weather';
}[] = [
  { type: 'sticky-notes', name: 'Sticky Notes', description: 'Quick notes and reminders', icon: '📝' },
  { type: 'flashcards', name: 'Flashcards', description: 'Study cards with flip animation', icon: '🃏' },
  { type: 'chess', name: 'Chess Game', description: 'Play chess with move history', icon: '♟️' },
  { type: 'sudoku', name: 'Sudoku', description: 'Brain training puzzles', icon: '🧩' },
  { type: 'fidget-tools', name: 'Fidget Tools', description: 'Stress relief tools', icon: '🎯' },
  { type: 'drawing-canvas', name: 'Drawing Canvas', description: 'Sketch and draw', icon: '🎨' },
  { type: 'ai-chat', name: 'AI Chat', description: 'Chat with AI assistant', icon: '🤖', apiKeyType: 'openai' },
  { type: 'timer', name: 'Timer', description: 'Focus timer sessions', icon: '⏱️' },
  { type: 'calculator', name: 'Calculator', description: 'Scientific calculator', icon: '🧮' },
  { type: 'weather', name: 'Weather', description: 'Local weather info', icon: '🌤️', apiKeyType: 'weather' },
];

export const widgetZones: { value: WidgetZone; label: string }[] = [
  { value: 'top', label: 'Top' },
  { value: 'left', label: 'Left' },
  { value: 'right', label: 'Right' },
  { value: 'bottom', label: 'Bottom' },
];
