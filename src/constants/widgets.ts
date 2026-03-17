import React from 'react';
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
import type { WidgetType, WidgetZone, WidgetCategory, WidgetSizingSpec } from '../types';

const StickyNotesWidget = React.lazy(() => import('../components/widgets/StickyNotesWidget'));
const FlashcardWidget = React.lazy(() => import('../components/widgets/FlashcardWidget'));
const ChessWidget = React.lazy(() => import('../components/widgets/ChessWidget'));
const SudokuWidget = React.lazy(() => import('../components/widgets/SudokuWidget'));
const FidgetToolsWidget = React.lazy(() => import('../components/widgets/FidgetToolsWidget'));
const DrawingCanvasWidget = React.lazy(() => import('../components/widgets/DrawingCanvasWidget'));
const AIChatWidget = React.lazy(() => import('../components/widgets/AIChatWidget'));
const TimerWidget = React.lazy(() => import('../components/widgets/TimerWidget'));
const CalculatorWidget = React.lazy(() => import('../components/widgets/CalculatorWidget'));
const WeatherWidget = React.lazy(() => import('../components/widgets/WeatherWidget'));

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
  category: WidgetCategory;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component: React.LazyExoticComponent<React.ComponentType<any>>;
  apiKeyType?: 'openai' | 'weather';
  sizing: WidgetSizingSpec;
}[] = [
  { type: 'sticky-notes', name: 'Sticky Notes', description: 'Quick notes and reminders', icon: StickyNote, category: 'productivity', component: StickyNotesWidget, sizing: { fitMode: 'fill', minHeight: 250, overflowBehavior: 'hidden' } },
  { type: 'flashcards', name: 'Flashcards', description: 'Study cards with flip animation', icon: Layers, category: 'productivity', component: FlashcardWidget, sizing: { fitMode: 'fill', minHeight: 200, overflowBehavior: 'hidden' } },
  { type: 'chess', name: 'Chess Game', description: 'Play chess with move history', icon: LayoutGrid, category: 'games', component: ChessWidget, sizing: { fitMode: 'contain', minWidth: 250, minHeight: 300, overflowBehavior: 'hidden' } },
  { type: 'sudoku', name: 'Sudoku', description: 'Brain training puzzles', icon: Grid3X3, category: 'games', component: SudokuWidget, sizing: { fitMode: 'contain', minWidth: 250, minHeight: 300, overflowBehavior: 'hidden' } },
  { type: 'fidget-tools', name: 'Fidget Tools', description: 'Stress relief tools', icon: BrainCog, category: 'games', component: FidgetToolsWidget, sizing: { fitMode: 'fill', minHeight: 150, overflowBehavior: 'hidden' } },
  { type: 'drawing-canvas', name: 'Drawing Canvas', description: 'Sketch and draw', icon: PenTool, category: 'creative', component: DrawingCanvasWidget, sizing: { fitMode: 'contain', minWidth: 280, minHeight: 200, preferredAspectRatio: 1.4, overflowBehavior: 'hidden' } },
  { type: 'ai-chat', name: 'AI Chat', description: 'Chat with AI assistant', icon: BotMessageSquare, category: 'ai', component: AIChatWidget, apiKeyType: 'openai', sizing: { fitMode: 'fill', minHeight: 250, overflowBehavior: 'scroll' } },
  { type: 'timer', name: 'Timer', description: 'Focus timer sessions', icon: Timer, category: 'productivity', component: TimerWidget, sizing: { fitMode: 'fill', minHeight: 150, overflowBehavior: 'hidden' } },
  { type: 'calculator', name: 'Calculator', description: 'Scientific calculator', icon: Calculator, category: 'productivity', component: CalculatorWidget, sizing: { fitMode: 'fill', minHeight: 200, overflowBehavior: 'hidden' } },
  { type: 'weather', name: 'Weather', description: 'Local weather info', icon: CloudSun, category: 'productivity', component: WeatherWidget, apiKeyType: 'weather', sizing: { fitMode: 'fill', minHeight: 150, overflowBehavior: 'hidden' } },
];

export function getWidgetComponent(type: WidgetType) {
  return widgetConfig.find(w => w.type === type)?.component;
}

export function getWidgetSizingSpec(type: WidgetType): WidgetSizingSpec {
  return widgetConfig.find(w => w.type === type)?.sizing ?? defaultSizingSpec;
}

export const widgetCategories: { value: WidgetCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'productivity', label: 'Productivity' },
  { value: 'games', label: 'Games' },
  { value: 'creative', label: 'Creative' },
  { value: 'ai', label: 'AI' },
];

export const widgetZones: { value: WidgetZone; label: string }[] = [
  { value: 'top', label: 'Top' },
  { value: 'left', label: 'Left' },
  { value: 'right', label: 'Right' },
  { value: 'bottom', label: 'Bottom' },
];
