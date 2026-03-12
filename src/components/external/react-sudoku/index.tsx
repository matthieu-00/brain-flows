// Attribution: Based on react-sudoku
// Repository: https://github.com/walterradduso/react-sudoku

import React, { useState, useEffect } from 'react';
import { RotateCcw, Lightbulb, Check } from 'lucide-react';

interface SudokuProps {
  onSave?: (puzzle: number[][], solution: number[][]) => void;
  initialPuzzle?: number[][];
  initialSolution?: number[][];
  className?: string;
}

// Easy sudoku puzzle
const defaultPuzzle = [
  [5, 3, 0, 0, 7, 0, 0, 0, 0],
  [6, 0, 0, 1, 9, 5, 0, 0, 0],
  [0, 9, 8, 0, 0, 0, 0, 6, 0],
  [8, 0, 0, 0, 6, 0, 0, 0, 3],
  [4, 0, 0, 8, 0, 3, 0, 0, 1],
  [7, 0, 0, 0, 2, 0, 0, 0, 6],
  [0, 6, 0, 0, 0, 0, 2, 8, 0],
  [0, 0, 0, 4, 1, 9, 0, 0, 5],
  [0, 0, 0, 0, 8, 0, 0, 7, 9],
];

const defaultSolution = [
  [5, 3, 4, 6, 7, 8, 9, 1, 2],
  [6, 7, 2, 1, 9, 5, 3, 4, 8],
  [1, 9, 8, 3, 4, 2, 5, 6, 7],
  [8, 5, 9, 7, 6, 1, 4, 2, 3],
  [4, 2, 6, 8, 5, 3, 7, 9, 1],
  [7, 1, 3, 9, 2, 4, 8, 5, 6],
  [9, 6, 1, 5, 3, 7, 2, 8, 4],
  [2, 8, 7, 4, 1, 9, 6, 3, 5],
  [3, 4, 5, 2, 8, 6, 1, 7, 9],
];

const ReactSudoku: React.FC<SudokuProps> = ({
  onSave,
  initialPuzzle = defaultPuzzle,
  initialSolution = defaultSolution,
  className = '',
}) => {
  const [puzzle, setPuzzle] = useState<number[][]>(() => 
    initialPuzzle.map(row => [...row])
  );
  const [solution] = useState<number[][]>(initialSolution);
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    const completed = puzzle.every((row, rowIndex) =>
      row.every((cell, colIndex) => cell === solution[rowIndex][colIndex])
    );
    setIsCompleted(completed);
  }, [puzzle, solution]);

  useEffect(() => {
    if (onSave) {
      onSave(puzzle, solution);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- onSave intentionally excluded to avoid infinite loop when parent updates widget state
  }, [puzzle, solution]);

  const isInitialCell = (row: number, col: number) => {
    return initialPuzzle[row][col] !== 0;
  };

  const handleCellClick = (row: number, col: number) => {
    if (isInitialCell(row, col)) return;
    setSelectedCell([row, col]);
  };

  const handleNumberInput = (number: number) => {
    if (!selectedCell) return;
    
    const [row, col] = selectedCell;
    if (isInitialCell(row, col)) return;
    
    const newPuzzle = puzzle.map((puzzleRow, rowIndex) =>
      puzzleRow.map((cell, colIndex) =>
        rowIndex === row && colIndex === col ? number : cell
      )
    );

    setPuzzle(newPuzzle);
  };

  const resetPuzzle = () => {
    setPuzzle(initialPuzzle.map(row => [...row]));
    setSelectedCell(null);
    setIsCompleted(false);
  };

  const getHint = () => {
    if (!selectedCell) return;
    
    const [row, col] = selectedCell;
    const correctNumber = solution[row][col];
    handleNumberInput(correctNumber);
  };

  const isSelected = (row: number, col: number) => {
    return selectedCell && selectedCell[0] === row && selectedCell[1] === col;
  };

  const getCellColor = (row: number, col: number) => {
    if (isSelected(row, col)) {
      return 'bg-blue-200 border-blue-400';
    }
    
    if (isInitialCell(row, col)) {
      return 'bg-gray-200 font-bold border-gray-400';
    }

    // Check if number is correct
    const currentValue = puzzle[row][col];
    const correctValue = solution[row][col];
    
    if (currentValue !== 0 && currentValue !== correctValue) {
      return 'bg-red-100 border-red-300 text-red-600';
    }
    
    const boxRow = Math.floor(row / 3);
    const boxCol = Math.floor(col / 3);
    const isEvenBox = (boxRow + boxCol) % 2 === 0;
    
    return isEvenBox ? 'bg-gray-50 border-gray-300' : 'bg-white border-gray-300';
  };

  return (
    <div className={`sudoku-container ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          {isCompleted && (
            <div className="flex items-center text-green-600">
              <Check className="w-5 h-5 mr-1" />
              <span className="font-semibold">Completed! 🎉</span>
            </div>
          )}
          {!isCompleted && (
            <span className="text-sm text-gray-600">
              Select a cell and choose a number
            </span>
          )}
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={getHint}
            disabled={!selectedCell || isInitialCell(selectedCell[0], selectedCell[1])}
            className="flex items-center px-3 py-1 text-sm bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Lightbulb className="w-4 h-4 mr-1" />
            Hint
          </button>
          <button
            onClick={resetPuzzle}
            className="flex items-center px-3 py-1 text-sm bg-gray-100 text-gray-800 rounded hover:bg-gray-200"
          >
            <RotateCcw className="w-4 h-4 mr-1" />
            Reset
          </button>
        </div>
      </div>

      {/* Sudoku Grid */}
      <div className="w-full max-w-xs mx-auto border-2 border-gray-800 rounded-lg overflow-hidden mb-4">
        <div className="grid grid-cols-9 gap-0">
          {puzzle.map((row, rowIndex) =>
            row.map((cell, colIndex) => (
              <button
                key={`${rowIndex}-${colIndex}`}
                onClick={() => handleCellClick(rowIndex, colIndex)}
                className={`aspect-square flex items-center justify-center text-xs sm:text-sm border transition-colors hover:bg-blue-100 ${getCellColor(rowIndex, colIndex)} ${
                  colIndex === 2 || colIndex === 5 ? 'border-r-2 border-r-gray-800' : ''
                } ${
                  rowIndex === 2 || rowIndex === 5 ? 'border-b-2 border-b-gray-800' : ''
                }`}
                disabled={isInitialCell(rowIndex, colIndex)}
              >
                {cell !== 0 ? cell : ''}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Number Input */}
      <div className="max-w-xs mx-auto grid grid-cols-5 gap-1.5">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((number) => (
          <button
            key={number}
            onClick={() => handleNumberInput(number)}
            disabled={!selectedCell || isInitialCell(selectedCell[0], selectedCell[1])}
            className="px-2 py-1.5 text-xs sm:text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {number === 0 ? '✕' : number}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ReactSudoku;