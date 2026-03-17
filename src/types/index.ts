// Core type definitions for the writing workspace platform

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

export type ExportFormat = 'pdf' | 'docx' | 'txt' | 'md';

export interface Document {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  wordCount: number;
  characterCount: number;
  exportFormat?: ExportFormat;
}

export type WidgetType = 
  | 'sticky-notes'
  | 'flashcards'
  | 'chess'
  | 'sudoku'
  | 'fidget-tools'
  | 'drawing-canvas'
  | 'ai-chat'
  | 'timer'
  | 'calculator'
  | 'weather';

export type WidgetCategory = 'productivity' | 'games' | 'creative' | 'ai';

export type WidgetZone = 'top' | 'bottom' | 'left' | 'right';

export type WidgetFitMode = 'contain' | 'fill';
export type WidgetOverflowBehavior = 'scroll' | 'hidden' | 'visible';

export interface WidgetSizingSpec {
  fitMode: WidgetFitMode;
  /**
   * Base minimum width in pixels, primarily used for side panels (left/right).
   */
  minWidth?: number;
  /**
   * Base minimum height in pixels, primarily used for side panels (left/right).
   */
  minHeight?: number;
  /**
   * Optional maximum height for the widget in pixels.
   */
  maxHeight?: number;
  preferredAspectRatio?: number;
  overflowBehavior: WidgetOverflowBehavior;
  /**
   * Optional overrides for strip zones (top/bottom) so we can keep those panels
   * more compact without affecting side panel behavior.
   */
  minHeightTop?: number;
  minHeightBottom?: number;
  /**
   * Shared cap for top/bottom when rendered in strip mode.
   */
  maxHeightTopBottom?: number;
}

export interface Widget {
  id: string;
  type: WidgetType;
  zone: WidgetZone;
  isEnabled: boolean;
  isCollapsed: boolean;
  position: number;
  size: number; // percentage of zone
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any; // widget-specific data
}

export interface LayoutConfig {
  topZoneHeight: number;
  bottomZoneHeight: number;
  leftZoneWidth: number;
  rightZoneWidth: number;
  isTopCollapsed: boolean;
  isBottomCollapsed: boolean;
  isLeftCollapsed: boolean;
  isRightCollapsed: boolean;
  topZonePreviousHeight?: number;
  bottomZonePreviousHeight?: number;
  leftZonePreviousWidth?: number;
  rightZonePreviousWidth?: number;
}

export interface UserProfile {
  displayName?: string;
  email?: string;
  avatar?: string; // data URL or base64
}

export type ShortcutId =
  | 'save'
  | 'export'
  | 'distractionFree'
  | 'agentChat'
  | 'widgetAdd'
  | 'widgetRemove'
  | 'resetLayout';

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  autoSaveInterval: number; // seconds
  distractionFreeMode: boolean;
  exportFormat: 'pdf' | 'docx' | 'txt' | 'md';
  defaultFileType: 'pdf' | 'docx' | 'txt' | 'md';
  editorFontFamily: string;
  editorFontSize: number;
  editorTextColor: string;
  apiKeys: {
    weather?: string;
  };
  profile?: UserProfile;
  /** User overrides for keyboard shortcuts. Combo format: "Ctrl+S", "Alt++", "Ctrl+Shift+Enter". */
  keyboardShortcuts?: Partial<Record<ShortcutId, string>>;
}

export interface StickyNote {
  id: string;
  content: string;
  color: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Flashcard {
  id: number;
  frontText: string;
  backText: string;
}

export interface ChessGame {
  id: string;
  fen: string; // FEN notation for chess.js
  pgn: string; // PGN notation for move history
  isGameOver: boolean;
  winner?: 'white' | 'black' | 'draw';
}

export interface SudokuPuzzle {
  id: string;
  puzzle: number[][]; // 9x9 array
  solution: number[][]; // 9x9 array
  difficulty: 'easy' | 'medium' | 'hard';
  completed: boolean;
}

export interface TimerSession {
  duration: number; // minutes
  breakDuration: number; // minutes
  isRunning: boolean;
  remainingTime: number; // seconds
  type: 'work' | 'break';
  sessionsCompleted: number;
}