import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Widget } from '../../types';
import { useLayoutStore } from '../../store/layoutStore';
import { Button } from '../ui/Button';
import { RotateCcw, Lightbulb, Sparkles } from 'lucide-react';

interface SudokuWidgetProps {
  widget: Widget;
}

type Difficulty = 'easy' | 'medium' | 'hard';
type Grid = number[][];

const CLUE_COUNTS: Record<Difficulty, number> = {
  easy: 35,
  medium: 28,
  hard: 22,
};

function createEmptyGrid(): Grid {
  return Array.from({ length: 9 }, () => Array(9).fill(0));
}

function isValidPlacement(grid: Grid, row: number, col: number, num: number): boolean {
  for (let c = 0; c < 9; c++) {
    if (grid[row][c] === num) return false;
  }
  for (let r = 0; r < 9; r++) {
    if (grid[r][col] === num) return false;
  }
  const boxRow = Math.floor(row / 3) * 3;
  const boxCol = Math.floor(col / 3) * 3;
  for (let r = boxRow; r < boxRow + 3; r++) {
    for (let c = boxCol; c < boxCol + 3; c++) {
      if (grid[r][c] === num) return false;
    }
  }
  return true;
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function solveSudoku(grid: Grid): boolean {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (grid[row][col] === 0) {
        const nums = shuffleArray([1, 2, 3, 4, 5, 6, 7, 8, 9]);
        for (const num of nums) {
          if (isValidPlacement(grid, row, col, num)) {
            grid[row][col] = num;
            if (solveSudoku(grid)) return true;
            grid[row][col] = 0;
          }
        }
        return false;
      }
    }
  }
  return true;
}

function generatePuzzle(difficulty: Difficulty): { puzzle: Grid; solution: Grid } {
  const solution = createEmptyGrid();
  solveSudoku(solution);

  const puzzle = solution.map(row => [...row]);
  const totalCells = 81;
  const cluesToKeep = CLUE_COUNTS[difficulty];
  let cellsToRemove = totalCells - cluesToKeep;

  const positions = shuffleArray(
    Array.from({ length: 81 }, (_, i) => [Math.floor(i / 9), i % 9] as [number, number])
  );

  for (const [r, c] of positions) {
    if (cellsToRemove <= 0) break;
    if (puzzle[r][c] !== 0) {
      puzzle[r][c] = 0;
      cellsToRemove--;
    }
  }

  return { puzzle, solution };
}

const SudokuWidget: React.FC<SudokuWidgetProps> = ({ widget }) => {
  const { updateWidget } = useLayoutStore();

  const [difficulty, setDifficulty] = useState<Difficulty>(
    (widget.data?.difficulty as Difficulty) || 'easy'
  );

  const [initialPuzzle, setInitialPuzzle] = useState<Grid>(() => {
    if (widget.data?.initialPuzzle) return widget.data.initialPuzzle as Grid;
    const { puzzle, solution } = generatePuzzle('easy');
    setTimeout(() => {
      updateWidget(widget.id, {
        data: {
          ...widget.data,
          initialPuzzle: puzzle,
          puzzle: puzzle.map((r: number[]) => [...r]),
          solution,
          difficulty: 'easy',
        },
      });
    }, 0);
    return puzzle;
  });

  const [puzzle, setPuzzle] = useState<Grid>(() => {
    if (widget.data?.puzzle) return (widget.data.puzzle as Grid).map((r: number[]) => [...r]);
    return initialPuzzle.map(r => [...r]);
  });

  const [solution, setSolution] = useState<Grid>(() => {
    if (widget.data?.solution) return widget.data.solution as Grid;
    const s = createEmptyGrid();
    const copy = initialPuzzle.map(r => [...r]);
    solveSudoku(copy);
    return copy;
  });

  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showDifficultyMenu, setShowDifficultyMenu] = useState(false);

  const isInitialCell = useCallback(
    (row: number, col: number) => initialPuzzle[row][col] !== 0,
    [initialPuzzle]
  );

  useEffect(() => {
    const completed =
      puzzle.length === 9 &&
      puzzle.every((row, ri) =>
        row.every((cell, ci) => cell !== 0 && cell === solution[ri][ci])
      );
    setIsCompleted(completed);
  }, [puzzle, solution]);

  const persistState = useCallback(
    (p: Grid, s: Grid, ip: Grid, diff: Difficulty) => {
      updateWidget(widget.id, {
        data: { puzzle: p, solution: s, initialPuzzle: ip, difficulty: diff },
      });
    },
    [widget.id, updateWidget]
  );

  useEffect(() => {
    persistState(puzzle, solution, initialPuzzle, difficulty);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [puzzle]);

  const handleCellClick = (row: number, col: number) => {
    if (isInitialCell(row, col)) {
      setSelectedCell([row, col]);
      return;
    }
    setSelectedCell([row, col]);
  };

  const handleNumberInput = (num: number) => {
    if (!selectedCell) return;
    const [row, col] = selectedCell;
    if (isInitialCell(row, col)) return;
    setPuzzle(prev =>
      prev.map((r, ri) => r.map((c, ci) => (ri === row && ci === col ? num : c)))
    );
  };

  const resetPuzzle = () => {
    setPuzzle(initialPuzzle.map(r => [...r]));
    setSelectedCell(null);
    setIsCompleted(false);
  };

  const newGame = (diff: Difficulty) => {
    const { puzzle: p, solution: s } = generatePuzzle(diff);
    setDifficulty(diff);
    setInitialPuzzle(p);
    setSolution(s);
    setPuzzle(p.map(r => [...r]));
    setSelectedCell(null);
    setIsCompleted(false);
    setShowDifficultyMenu(false);
    persistState(p.map(r => [...r]), s, p, diff);
  };

  const getHint = () => {
    if (!selectedCell) return;
    const [row, col] = selectedCell;
    if (isInitialCell(row, col)) return;
    handleNumberInput(solution[row][col]);
  };

  const sameRowColBox = useMemo(() => {
    if (!selectedCell) return new Set<string>();
    const [sr, sc] = selectedCell;
    const keys = new Set<string>();
    for (let i = 0; i < 9; i++) {
      keys.add(`${sr}-${i}`);
      keys.add(`${i}-${sc}`);
    }
    const br = Math.floor(sr / 3) * 3;
    const bc = Math.floor(sc / 3) * 3;
    for (let r = br; r < br + 3; r++) {
      for (let c = bc; c < bc + 3; c++) {
        keys.add(`${r}-${c}`);
      }
    }
    return keys;
  }, [selectedCell]);

  const getCellClasses = (row: number, col: number) => {
    const isSelected = selectedCell?.[0] === row && selectedCell?.[1] === col;
    const isGiven = isInitialCell(row, col);
    const value = puzzle[row][col];
    const isError = value !== 0 && value !== solution[row][col];
    const isHighlighted = sameRowColBox.has(`${row}-${col}`);

    let base =
      'aspect-square flex items-center justify-center text-xs sm:text-sm transition-colors font-body select-none ';

    if (isSelected) {
      base += 'bg-sage-200 dark:bg-sage-700/50 border-sage-700 dark:border-sage-400 z-10 ring-1 ring-inset ring-sage-700 dark:ring-sage-400 ';
    } else if (isError) {
      base += 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 ';
    } else if (isGiven) {
      base += 'bg-neutral-100 dark:bg-neutral-800 font-bold text-neutral-900 dark:text-neutral-100 ';
    } else if (isHighlighted) {
      base += 'bg-sage-50 dark:bg-sage-900/20 ';
    } else {
      const boxRow = Math.floor(row / 3);
      const boxCol = Math.floor(col / 3);
      const isEvenBox = (boxRow + boxCol) % 2 === 0;
      base += isEvenBox
        ? 'bg-white dark:bg-neutral-900 '
        : 'bg-neutral-50 dark:bg-neutral-850 ';
    }

    let border = 'border border-neutral-200 dark:border-neutral-700 ';
    if (col === 2 || col === 5) border += 'border-r-2 border-r-neutral-500 dark:border-r-neutral-500 ';
    if (row === 2 || row === 5) border += 'border-b-2 border-b-neutral-500 dark:border-b-neutral-500 ';

    return base + border;
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!selectedCell) return;
      const key = e.key;
      if (key >= '1' && key <= '9') {
        handleNumberInput(parseInt(key));
      } else if (key === 'Backspace' || key === 'Delete' || key === '0') {
        handleNumberInput(0);
      } else if (key === 'ArrowUp' && selectedCell[0] > 0) {
        setSelectedCell([selectedCell[0] - 1, selectedCell[1]]);
      } else if (key === 'ArrowDown' && selectedCell[0] < 8) {
        setSelectedCell([selectedCell[0] + 1, selectedCell[1]]);
      } else if (key === 'ArrowLeft' && selectedCell[1] > 0) {
        setSelectedCell([selectedCell[0], selectedCell[1] - 1]);
      } else if (key === 'ArrowRight' && selectedCell[1] < 8) {
        setSelectedCell([selectedCell[0], selectedCell[1] + 1]);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCell, initialPuzzle]);

  return (
    <div className="w-full h-full overflow-hidden font-body">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          {isCompleted ? (
            <div className="flex items-center text-sage-700 dark:text-sage-400">
              <Sparkles className="w-4 h-4 mr-1" />
              <span className="text-sm font-display font-semibold">Completed!</span>
            </div>
          ) : (
            <span className="text-xs text-neutral-500 dark:text-neutral-400 capitalize">
              {difficulty}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            onClick={getHint}
            disabled={!selectedCell || (selectedCell != null && isInitialCell(selectedCell[0], selectedCell[1]))}
            variant="ghost"
            size="sm"
            title="Hint"
          >
            <Lightbulb className="w-3.5 h-3.5 mr-1" />
            Hint
          </Button>
          <Button onClick={resetPuzzle} variant="ghost" size="sm" title="Reset">
            <RotateCcw className="w-3.5 h-3.5 mr-1" />
            Reset
          </Button>
          <div className="relative">
            <Button
              onClick={() => setShowDifficultyMenu(v => !v)}
              variant="secondary"
              size="sm"
            >
              New Game
            </Button>
            {showDifficultyMenu && (
              <div className="absolute right-0 top-full mt-1 z-50 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg overflow-hidden">
                {(['easy', 'medium', 'hard'] as Difficulty[]).map(d => (
                  <button
                    key={d}
                    onClick={() => newGame(d)}
                    className="block w-full text-left px-4 py-2 text-sm text-neutral-800 dark:text-neutral-200 hover:bg-sage-100 dark:hover:bg-sage-800/30 capitalize font-body"
                  >
                    {d}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="w-full max-w-xs mx-auto border-2 border-neutral-500 dark:border-neutral-500 rounded-lg overflow-hidden mb-3">
        <div className="grid grid-cols-9 gap-0">
          {puzzle.map((row, ri) =>
            row.map((cell, ci) => (
              <button
                key={`${ri}-${ci}`}
                onClick={() => handleCellClick(ri, ci)}
                className={getCellClasses(ri, ci)}
              >
                {cell !== 0 ? cell : ''}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Number Pad */}
      <div className="max-w-xs mx-auto grid grid-cols-5 gap-1.5">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map(num => (
          <button
            key={num}
            onClick={() => handleNumberInput(num)}
            disabled={
              !selectedCell || (selectedCell != null && isInitialCell(selectedCell[0], selectedCell[1]))
            }
            className={`px-2 py-1.5 text-sm rounded-lg border transition-colors font-body
              ${
                num === 0
                  ? 'bg-neutral-100 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-600 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                  : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 hover:bg-sage-50 dark:hover:bg-sage-900/20'
              }
              disabled:opacity-40 disabled:cursor-not-allowed
              focus:outline-none focus:ring-2 focus:ring-sage-700 dark:focus:ring-sage-500`}
          >
            {num === 0 ? '✕' : num}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SudokuWidget;
