import type { LucideIcon } from 'lucide-react';
import {
  StickyNote,
  Layers,
  LayoutGrid,
  Grid3X3,
  BrainCog,
  PenTool,
  BotMessageSquare,
  Timer,
  Calculator,
  CloudSun,
} from 'lucide-react';
import type { WidgetType, WidgetZone, WidgetSizingSpec } from '../types';

export const defaultSizingSpec: WidgetSizingSpec = {
  fitMode: 'fill',
  minHeight: 200,
  overflowBehavior: 'scroll',
};

export const widgetConfig: {
  type: WidgetType;
  name: string;
  description: string;
  icon: LucideIcon;
  apiKeyType?: 'openai' | 'weather';
  sizing: WidgetSizingSpec;
}[] = [
  { type: 'sticky-notes', name: 'Sticky Notes', description: 'Quick notes and reminders', icon: StickyNote, sizing: { fitMode: 'fill', minHeight: 250, overflowBehavior: 'hidden' } },
  { type: 'flashcards', name: 'Flashcards', description: 'Study cards with flip animation', icon: Layers, sizing: { fitMode: 'fill', minHeight: 200, overflowBehavior: 'hidden' } },
  { type: 'chess', name: 'Chess Game', description: 'Play chess with move history', icon: LayoutGrid, sizing: { fitMode: 'contain', minWidth: 250, minHeight: 300, overflowBehavior: 'hidden' } },
  { type: 'sudoku', name: 'Sudoku', description: 'Brain training puzzles', icon: Grid3X3, sizing: { fitMode: 'contain', minWidth: 250, minHeight: 300, overflowBehavior: 'hidden' } },
  { type: 'fidget-tools', name: 'Fidget Tools', description: 'Stress relief tools', icon: BrainCog, sizing: { fitMode: 'fill', minHeight: 150, overflowBehavior: 'hidden' } },
  { type: 'drawing-canvas', name: 'Drawing Canvas', description: 'Sketch and draw', icon: PenTool, sizing: { fitMode: 'contain', minWidth: 280, minHeight: 200, preferredAspectRatio: 1.4, overflowBehavior: 'hidden' } },
  { type: 'ai-chat', name: 'AI Chat', description: 'Chat with AI assistant', icon: BotMessageSquare, apiKeyType: 'openai', sizing: { fitMode: 'fill', minHeight: 250, overflowBehavior: 'scroll' } },
  { type: 'timer', name: 'Timer', description: 'Focus timer sessions', icon: Timer, sizing: { fitMode: 'fill', minHeight: 150, overflowBehavior: 'hidden' } },
  { type: 'calculator', name: 'Calculator', description: 'Scientific calculator', icon: Calculator, sizing: { fitMode: 'fill', minHeight: 200, overflowBehavior: 'hidden' } },
  { type: 'weather', name: 'Weather', description: 'Local weather info', icon: CloudSun, apiKeyType: 'weather', sizing: { fitMode: 'fill', minHeight: 150, overflowBehavior: 'hidden' } },
];

export function getWidgetSizingSpec(type: WidgetType): WidgetSizingSpec {
  return widgetConfig.find(w => w.type === type)?.sizing ?? defaultSizingSpec;
}

export const widgetZones: { value: WidgetZone; label: string }[] = [
  { value: 'top', label: 'Top' },
  { value: 'left', label: 'Left' },
  { value: 'right', label: 'Right' },
  { value: 'bottom', label: 'Bottom' },
];
