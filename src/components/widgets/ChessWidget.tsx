import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { Chess, Square } from 'chess.js';
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

const PIECE_UNICODE: Record<string, string> = {
  wk: '\u2654', wq: '\u2655', wr: '\u2656', wb: '\u2657', wn: '\u2658', wp: '\u2659',
  bk: '\u265A', bq: '\u265B', br: '\u265C', bb: '\u265D', bn: '\u265E', bp: '\u265F',
};

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const;
const RANKS = [8, 7, 6, 5, 4, 3, 2, 1] as const;

function squareToAlgebraic(row: number, col: number): Square {
  return `${FILES[col]}${RANKS[row]}` as Square;
}

const ChessWidget: React.FC<ChessWidgetProps> = ({ widget }) => {
  const { updateWidget } = useLayoutStore();

  const boardContainerRef = useRef<HTMLDivElement>(null);
  const [boardSize, setBoardSize] = useState(280);

  useEffect(() => {
    const el = boardContainerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        const h = entry.contentRect.height;
        const side = Math.max(150, Math.min(Math.floor(w), Math.floor(h)));
        setBoardSize(side);
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const [game, setGame] = useState(() => {
    const savedData = widget.data as ChessGameData | undefined;
    if (savedData?.fen) {
      try {
        return new Chess(savedData.fen);
      } catch {
        return new Chess();
      }
    }
    return new Chess();
  });

  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);

  const validMoves = useMemo(() => {
    if (!selectedSquare) return new Set<string>();
    try {
      const moves = game.moves({ square: selectedSquare, verbose: true });
      return new Set(moves.map(m => m.to));
    } catch {
      return new Set<string>();
    }
  }, [game, selectedSquare]);

  const saveGameState = useCallback(
    (currentGame: Chess) => {
      const gameData: ChessGameData = {
        fen: currentGame.fen(),
        pgn: currentGame.pgn(),
        gameStatus: currentGame.isGameOver() ? 'Game Over' : 'In Progress',
        currentPlayer: currentGame.turn() === 'w' ? 'white' : 'black',
        moveHistory: currentGame.history(),
      };
      updateWidget(widget.id, { data: gameData });
    },
    [widget.id, updateWidget]
  );

  const handleSquareClick = useCallback(
    (square: Square) => {
      if (game.isGameOver()) return;

      const piece = game.get(square);

      if (selectedSquare) {
        if (selectedSquare === square) {
          setSelectedSquare(null);
          return;
        }

        if (validMoves.has(square)) {
          const gameCopy = new Chess(game.fen());
          try {
            const move = gameCopy.move({
              from: selectedSquare,
              to: square,
              promotion: 'q',
            });
            if (move) {
              setGame(gameCopy);
              setSelectedSquare(null);
              saveGameState(gameCopy);
              return;
            }
          } catch {
            // fall through
          }
        }

        if (piece && piece.color === game.turn()) {
          setSelectedSquare(square);
          return;
        }

        setSelectedSquare(null);
        return;
      }

      if (piece && piece.color === game.turn()) {
        setSelectedSquare(square);
      }
    },
    [game, selectedSquare, validMoves, saveGameState]
  );

  const resetGame = useCallback(() => {
    const newGame = new Chess();
    setGame(newGame);
    setSelectedSquare(null);
    saveGameState(newGame);
  }, [saveGameState]);

  const getGameStatus = () => {
    if (game.isCheckmate()) {
      return `Checkmate! ${game.turn() === 'w' ? 'Black' : 'White'} wins!`;
    }
    if (game.isDraw()) return 'Draw';
    if (game.isStalemate()) return 'Stalemate';
    if (game.isThreefoldRepetition()) return 'Draw by repetition';
    if (game.isInsufficientMaterial()) return 'Draw — insufficient material';
    if (game.isCheck()) {
      return `${game.turn() === 'w' ? 'White' : 'Black'} is in check`;
    }
    return `${game.turn() === 'w' ? 'White' : 'Black'} to move`;
  };

  const squareSize = boardSize / 8;

  return (
    <div className="w-full h-full min-h-0 flex flex-col overflow-hidden font-body">
      {/* Controls */}
      <div className="flex shrink-0 items-center justify-end mb-3">
        <Button onClick={resetGame} variant="secondary" size="sm" title="New Game">
          <RotateCcw className="w-4 h-4 mr-1" />
          New Game
        </Button>
      </div>

      {/* Game Status */}
      <div className="shrink-0 mb-3 p-2.5 bg-sage-100 dark:bg-sage-400/20 rounded-lg">
        <p className="text-sm font-medium text-sage-900 dark:text-sage-200 font-display">
          {getGameStatus()}
        </p>
        {game.history().length > 0 && (
          <p className="text-xs text-sage-700 dark:text-sage-400 mt-0.5">
            Last move: {game.history().slice(-1)[0]}
          </p>
        )}
      </div>

      {/* Board */}
      <div
        ref={boardContainerRef}
        className="flex-1 min-h-0 w-full flex items-center justify-center"
      >
        <div
          className="relative border-2 border-neutral-400 dark:border-neutral-600 rounded-lg overflow-hidden shadow-md"
          style={{ width: boardSize, height: boardSize }}
        >
          {/* Squares */}
          <div className="grid grid-cols-8 w-full h-full">
            {RANKS.map((rank, rowIdx) =>
              FILES.map((file, colIdx) => {
                const square = squareToAlgebraic(rowIdx, colIdx);
                const piece = game.get(square);
                const isLight = (rowIdx + colIdx) % 2 === 0;
                const isSelected = selectedSquare === square;
                const isValidTarget = validMoves.has(square);
                const isLastMove = (() => {
                  const history = game.history({ verbose: true });
                  if (history.length === 0) return false;
                  const last = history[history.length - 1];
                  return last.from === square || last.to === square;
                })();

                const pieceKey = piece
                  ? `${piece.color}${piece.type}`
                  : null;

                return (
                  <button
                    key={square}
                    onClick={() => handleSquareClick(square)}
                    className={`relative flex items-center justify-center transition-colors
                      ${isLight
                        ? 'bg-sage-100 dark:bg-sage-200'
                        : 'bg-sage-700 dark:bg-sage-800'
                      }
                      ${isSelected ? 'ring-2 ring-inset ring-sage-400 dark:ring-sage-300 z-10' : ''}
                      ${isLastMove && !isSelected ? (isLight ? 'bg-sage-200 dark:bg-sage-300' : 'bg-sage-600 dark:bg-sage-700') : ''}
                    `}
                    style={{
                      width: squareSize,
                      height: squareSize,
                      fontSize: squareSize * 0.7,
                      lineHeight: 1,
                    }}
                  >
                    {/* Valid move indicator */}
                    {isValidTarget && !piece && (
                      <span
                        className="absolute rounded-full bg-sage-500/40 dark:bg-sage-400/40"
                        style={{
                          width: squareSize * 0.25,
                          height: squareSize * 0.25,
                        }}
                      />
                    )}
                    {isValidTarget && piece && (
                      <span
                        className="absolute inset-0 rounded-sm ring-2 ring-inset ring-sage-500/50 dark:ring-sage-400/50"
                      />
                    )}

                    {/* Piece */}
                    {pieceKey && (
                      <span
                        className={`select-none pointer-events-none ${
                          isLight
                            ? 'text-neutral-900 dark:text-neutral-900'
                            : 'text-white dark:text-neutral-100'
                        }`}
                        style={{
                          textShadow: piece.color === 'w'
                            ? '0 1px 2px rgba(0,0,0,0.3)'
                            : '0 1px 2px rgba(0,0,0,0.5)',
                        }}
                      >
                        {PIECE_UNICODE[pieceKey]}
                      </span>
                    )}

                    {/* Coordinates */}
                    {colIdx === 0 && (
                      <span
                        className={`absolute top-0.5 left-0.5 text-[9px] font-bold leading-none select-none pointer-events-none ${
                          isLight
                            ? 'text-sage-600 dark:text-sage-700'
                            : 'text-sage-300 dark:text-sage-400'
                        }`}
                      >
                        {rank}
                      </span>
                    )}
                    {rowIdx === 7 && (
                      <span
                        className={`absolute bottom-0.5 right-0.5 text-[9px] font-bold leading-none select-none pointer-events-none ${
                          isLight
                            ? 'text-sage-600 dark:text-sage-700'
                            : 'text-sage-300 dark:text-sage-400'
                        }`}
                      >
                        {file}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Move History */}
      {game.history().length > 0 && (
        <div className="shrink-0 mt-3 p-2.5 bg-neutral-100 dark:bg-neutral-800 rounded-lg max-h-24 overflow-y-auto">
          <p className="text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1 font-display">
            Move History
          </p>
          <div className="text-xs text-neutral-600 dark:text-neutral-400 flex flex-wrap gap-x-2 gap-y-0.5">
            {game.history().map((move, index) => (
              <span key={index} className="inline-block">
                {index % 2 === 0 && (
                  <span className="text-neutral-400 dark:text-neutral-500 mr-0.5">
                    {Math.floor(index / 2) + 1}.
                  </span>
                )}
                {move}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChessWidget;
