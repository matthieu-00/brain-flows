# Phase 4 Manual Test Checklist

## 4.3 Error Handling

- [ ] Widget crash is isolated by widget-level error boundary.
- [ ] App-level crash shows root-level fallback instead of blank screen.
- [ ] AI chat shows inline API key validation errors (no browser alerts).
- [ ] Weather widget shows inline location/API failures and retry action.
- [ ] Chess widget shows inline feedback for invalid moves.

## 4.4 Performance

- [x] Run `npm run build` and capture baseline chunk sizes from `dist/assets` (widgets are code-split; main chunk ~2.1MB, widget chunks 0.37–137 kB).
- [x] Run `npm run build:analyze` and inspect `stats.html` for heavy bundles (script: `npm run build:analyze`).
- [ ] Profile UI interactions with React DevTools Profiler using multiple widgets (manual).
- [ ] Verify smooth drag/resize and widget interactions with high widget count (manual).
- [ ] Leave app open for 30+ minutes and inspect memory usage in browser tools (manual).

Re-renders are optimized via React.memo on WidgetContainer and Zustand selectors in WidgetZone. Animations use framer-motion with short durations (0.2s).

## 4.1 Data Persistence

- [ ] Flashcards persist after reload using plain text front/back data.
- [ ] Sticky notes persist content, color, and position after reload.
- [ ] Drawing canvas persists drawing data and restores correctly on reload.
- [ ] Chess game state (FEN/PGN/history) persists across refresh.
- [ ] Sudoku puzzle and current state persist across refresh.
- [ ] AI chat history persists and timestamps still render correctly.
- [ ] Current document content persists and auto-save updates `lastSaved`.
- [ ] Widget layout, enabled widgets, and app settings persist across refresh.
