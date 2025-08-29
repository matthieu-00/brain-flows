// Chess Widget - Powered by react-chessboard and chess.js
// Original libraries: https://github.com/Clariity/react-chessboard and https://github.com/jhlywa/chess.js

import React, { useState, useCallback, useEffect } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { useLayoutStore } from '../../store/layoutStore';
import { Widget } from '../../types';
import { RotateCcw, Play, Pause } from 'lucide-react';
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
  
  // Initialize chess game
  const [game, setGame] = useState(() => new Chess());
  const [gamePosition, setGamePosition] = useState(game.fen());
  
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
        setGame(gameCopy);
        setGamePosition(gameCopy.fen());
        saveGameState(gameCopy);
        return true;
      }
    } catch (error) {
      // Invalid move
      return false;
    }
    
    return false;
  }, [game, saveGameState]);

  // Reset game
  const resetGame = useCallback(() => {
    const newGame = new Chess();
    setGame(newGame);
    setGamePosition(newGame.fen());
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
        <div className="mb-4 p-3 bg-sage-100 rounded-lg">
          <p className="text-sm font-medium text-sage-900">
            {getGameStatus()}
          </p>
          {game.history().length > 0 && (
            <p className="text-xs text-sage-700 mt-1">
              Last move: {game.history().slice(-1)[0]}
            </p>
          )}
        </div>


        {/* Chess Board */}
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-md aspect-square">
            <Chessboard
              position={gamePosition}
              onPieceDrop={onDrop}
              boardWidth={Math.min(300, window.innerWidth - 100)}
              customBoardStyle={{
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
              customDarkSquareStyle={{ backgroundColor: '#4A7C59' }}
              customLightSquareStyle={{ backgroundColor: '#E8F5E8' }}
            />
          </div>
        </div>

        {/* Move History */}
        {game.history().length > 0 && (
          <div className="mt-4 p-3 bg-neutral-100 rounded-lg max-h-24 overflow-y-auto">
            <p className="text-xs font-medium text-neutral-700 mb-1">Move History:</p>
            <div className="text-xs text-neutral-600 space-x-2">
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