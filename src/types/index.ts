// Core type definitions for the writing workspace platform

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

export interface Document {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  wordCount: number;
  characterCount: number;
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

export type WidgetZone = 'top' | 'bottom' | 'left' | 'right';

export interface Widget {
  id: string;
  type: WidgetType;
  zone: WidgetZone;
  isEnabled: boolean;
  isCollapsed: boolean;
  position: number;
  size: number; // percentage of zone
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

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  autoSaveInterval: number; // seconds
  distractionFreeMode: boolean;
  exportFormat: 'pdf' | 'docx' | 'txt';
  apiKeys: {
    openai?: string;
    weather?: string;
  };
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
  front: { html: React.ReactNode };
  back: { html: React.ReactNode };
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