// Attribution: Based on react-sudoku
// Repository: https://github.com/walterradduso/react-sudoku

import React from 'react';
import { Widget } from '../../types';
import { useLayoutStore } from '../../store/layoutStore';
import ReactSudoku from '../external/react-sudoku';

interface SudokuWidgetProps {
  widget: Widget;
}

const SudokuWidget: React.FC<SudokuWidgetProps> = ({ widget }) => {
  const { updateWidget } = useLayoutStore();
  
  const handleSave = (puzzle: number[][], solution: number[][]) => {
    updateWidget(widget.id, {
      data: {
        ...widget.data,
        puzzle,
        solution,
      }
    });
  };

  const savedPuzzle = widget.data?.puzzle;
  const savedSolution = widget.data?.solution;

  return (
    <div className="bg-white dark:bg-neutral-surface rounded-lg p-4">
      <ReactSudoku
        onSave={handleSave}
        initialPuzzle={savedPuzzle}
        initialSolution={savedSolution}
        className="w-full"
      />
    </div>
  );
};

export default SudokuWidget;