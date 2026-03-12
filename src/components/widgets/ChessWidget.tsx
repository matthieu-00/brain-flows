// Chess Widget - Powered by react-chessboard and chess.js
// Original libraries: https://github.com/Clariity/react-chessboard and https://github.com/jhlywa/chess.js

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { useLayoutStore } from '../../store/layoutStore';
import { Widget } from '../../types';
import { RotateCcw } from 'lucide-react';
import { Button } from '../ui/Button';

interface ChessWidgetProps {
  widget: Widget;
}

interface ChessGameData {
  fen: string;
  pgn: string;
  gameStatus: string;
  currentPlayer: 'white' | 'black';
  moveHistory: string[];
}

const ChessWidget: React.FC<ChessWidgetProps> = ({ widget }) => {
  const { updateWidget } = useLayoutStore();
  
  const boardContainerRef = useRef<HTMLDivElement>(null);
  const [boardSize, setBoardSize] = useState(280);

  useEffect(() => {
    const el = boardContainerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        setBoardSize(Math.max(150, w));
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const [game, setGame] = useState(() => new Chess());
  const [gamePosition, setGamePosition] = useState(game.fen());
  const [invalidMoveMessage, setInvalidMoveMessage] = useState('');
  
  // Load saved game state
  useEffect(() => {
    const savedData = widget.data as ChessGameData;
    if (savedData?.fen) {
      const newGame = new Chess(savedData.fen);
      setGame(newGame);
      setGamePosition(newGame.fen());
    }
  }, [widget.data]);

  // Save game state
  const saveGameState = useCallback((currentGame: Chess) => {
    const gameData: ChessGameData = {
      fen: currentGame.fen(),
      pgn: currentGame.pgn(),
      gameStatus: currentGame.isGameOver() ? 'Game Over' : 'In Progress',
      currentPlayer: currentGame.turn() === 'w' ? 'white' : 'black',
      moveHistory: currentGame.history()
    };
    
    updateWidget(widget.id, { data: gameData });
  }, [widget.id, updateWidget]);

  // Handle piece moves
  const onDrop = useCallback((sourceSquare: string, targetSquare: string) => {
    const gameCopy = new Chess(game.fen());
    
    try {
      const move = gameCopy.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q' // Always promote to queen for simplicity
      });

      if (move) {
        setInvalidMoveMessage('');
        setGame(gameCopy);
        setGamePosition(gameCopy.fen());
        saveGameState(gameCopy);
        return true;
      }
    } catch {
      // Invalid move
      setInvalidMoveMessage('Invalid move. Try a legal move.');
      return false;
    }
    
    return false;
  }, [game, saveGameState]);

  // Reset game
  const resetGame = useCallback(() => {
    const newGame = new Chess();
    setGame(newGame);
    setGamePosition(newGame.fen());
    setInvalidMoveMessage('');
    saveGameState(newGame);
  }, [saveGameState]);

  // Get game status
  const getGameStatus = () => {
    if (game.isCheckmate()) {
      return `Checkmate! ${game.turn() === 'w' ? 'Black' : 'White'} wins!`;
    }
    if (game.isDraw()) {
      return 'Game is a draw';
    }
    if (game.isCheck()) {
      return `${game.turn() === 'w' ? 'White' : 'Black'} is in check`;
    }
    return `${game.turn() === 'w' ? 'White' : 'Black'} to move`;
  };

  return (
    <div className="w-full h-full overflow-hidden">
      {/* Controls */}
      <div className="flex items-center justify-end mb-4">
        <Button
          onClick={resetGame}
          variant="secondary"
          size="sm"
          title="New Game"
        >
          <RotateCcw className="w-4 h-4 mr-1" />
          New Game
        </Button>
      </div>

      {/* Game Content */}
      <div className="flex flex-col h-full">
        {/* Game Status */}
        <div className="mb-4 p-3 bg-sage-100 dark:bg-sage-400/20 rounded-lg">
          <p className="text-sm font-medium text-sage-900">
            {getGameStatus()}
          </p>
          {game.history().length > 0 && (
            <p className="text-xs text-sage-700 mt-1">
              Last move: {game.history().slice(-1)[0]}
            </p>
          )}
          {invalidMoveMessage && (
            <p className="text-xs text-red-600 mt-1">{invalidMoveMessage}</p>
          )}
        </div>


        {/* Chess Board */}
        <div ref={boardContainerRef} className="flex-1 flex items-center justify-center">
          <Chessboard
            position={gamePosition}
            onPieceDrop={onDrop}
            boardWidth={boardSize}
            customBoardStyle={{
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
            customDarkSquareStyle={{ backgroundColor: '#4A7C59' }}
            customLightSquareStyle={{ backgroundColor: '#E8F5E8' }}
          />
        </div>

        {/* Move History */}
        {game.history().length > 0 && (
          <div className="mt-4 p-3 bg-neutral-100 dark:bg-neutral-800 rounded-lg max-h-24 overflow-y-auto">
            <p className="text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">Move History:</p>
            <div className="text-xs text-neutral-600 dark:text-neutral-textMuted space-x-2">
              {game.history().map((move, index) => (
                <span key={index} className="inline-block">
                  {Math.floor(index / 2) + 1}.{index % 2 === 0 ? '' : '..'} {move}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChessWidget;