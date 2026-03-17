// Attribution: Based on flatdraw
// Repository: https://github.com/diogocapela/flatdraw

import React, { useRef, useEffect, useState } from 'react';
import { Palette, Eraser, Download, Trash2, Undo, Redo } from 'lucide-react';

interface FlatDrawProps {
  width?: number;
  height?: number;
  onSave?: (dataUrl: string) => void;
  initialData?: string;
  className?: string;
}

interface DrawingState {
  paths: Path[];
  currentPath: Path | null;
  tool: 'pen' | 'eraser';
  color: string;
  size: number;
  history: Path[][];
  historyIndex: number;
}

interface Path {
  points: Point[];
  color: string;
  size: number;
  tool: 'pen' | 'eraser';
}

interface Point {
  x: number;
  y: number;
}

const FlatDraw: React.FC<FlatDrawProps> = ({
  width = 400,
  height = 300,
  onSave,
  initialData,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [state, setState] = useState<DrawingState>({
    paths: [],
    currentPath: null,
    tool: 'pen',
    color: '#000000',
    size: 2,
    history: [[]],
    historyIndex: 0,
  });

  const colors = [
    '#000000', '#ff0000', '#00ff00', '#0000ff',
    '#ffff00', '#ff00ff', '#00ffff', '#ffa500',
    '#800080', '#008000', '#800000', '#008080'
  ];

  useEffect(() => {
    if (initialData && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const img = new Image();
        img.onload = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
        };
        img.src = initialData;
      }
    }
  }, [initialData]);

  const redraw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    state.paths.forEach(path => {
      if (path.points.length < 2) return;

      ctx.beginPath();
      ctx.moveTo(path.points[0].x, path.points[0].y);

      for (let i = 1; i < path.points.length; i++) {
        ctx.lineTo(path.points[i].x, path.points[i].y);
      }

      ctx.strokeStyle = path.color;
      ctx.lineWidth = path.size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      if (path.tool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
      } else {
        ctx.globalCompositeOperation = 'source-over';
      }
      
      ctx.stroke();
    });

    // Draw current path
    if (state.currentPath && state.currentPath.points.length > 1) {
      ctx.beginPath();
      ctx.moveTo(state.currentPath.points[0].x, state.currentPath.points[0].y);

      for (let i = 1; i < state.currentPath.points.length; i++) {
        ctx.lineTo(state.currentPath.points[i].x, state.currentPath.points[i].y);
      }

      ctx.strokeStyle = state.currentPath.color;
      ctx.lineWidth = state.currentPath.size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      if (state.currentPath.tool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
      } else {
        ctx.globalCompositeOperation = 'source-over';
      }
      
      ctx.stroke();
    }
  };

  useEffect(() => {
    redraw();
  }, [state.paths, state.currentPath]);

  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const point = getMousePos(e);
    
    const newPath: Path = {
      points: [point],
      color: state.color,
      size: state.size,
      tool: state.tool,
    };

    setState(prev => ({
      ...prev,
      currentPath: newPath,
    }));
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !state.currentPath) return;

    const point = getMousePos(e);
    setState(prev => ({
      ...prev,
      currentPath: prev.currentPath ? {
        ...prev.currentPath,
        points: [...prev.currentPath.points, point],
      } : null,
    }));
  };

  const stopDrawing = () => {
    if (!isDrawing || !state.currentPath) return;

    setIsDrawing(false);
    
    setState(prev => {
      const newPaths = [...prev.paths, prev.currentPath!];
      const newHistory = prev.history.slice(0, prev.historyIndex + 1);
      newHistory.push([...newPaths]);
      
      return {
        ...prev,
        paths: newPaths,
        currentPath: null,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    });

    // Save the drawing
    setTimeout(() => {
      if (onSave && canvasRef.current) {
        onSave(canvasRef.current.toDataURL());
      }
    }, 100);
  };

  const clear = () => {
    setState(prev => {
      const newHistory = [...prev.history, []];
      return {
        ...prev,
        paths: [],
        currentPath: null,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    });
  };

  const undo = () => {
    if (state.historyIndex > 0) {
      setState(prev => ({
        ...prev,
        paths: prev.history[prev.historyIndex - 1],
        historyIndex: prev.historyIndex - 1,
      }));
    }
  };

  const redo = () => {
    if (state.historyIndex < state.history.length - 1) {
      setState(prev => ({
        ...prev,
        paths: prev.history[prev.historyIndex + 1],
        historyIndex: prev.historyIndex + 1,
      }));
    }
  };

  const download = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = 'drawing.png';
    link.href = canvas.toDataURL();
    link.click();
  };

  return (
    <div className={`flatdraw-container ${className}`}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 mb-4 p-3 bg-neutral-50 rounded-lg">
        {/* Tools */}
        <div className="flex gap-1">
          <button
            onClick={() => setState(prev => ({ ...prev, tool: 'pen' }))}
            className={`p-2 rounded ${state.tool === 'pen' ? 'bg-blue-500 text-white' : 'bg-white'}`}
          >
            <Palette className="w-4 h-4" />
          </button>
          <button
            onClick={() => setState(prev => ({ ...prev, tool: 'eraser' }))}
            className={`p-2 rounded ${state.tool === 'eraser' ? 'bg-blue-500 text-white' : 'bg-white'}`}
          >
            <Eraser className="w-4 h-4" />
          </button>
        </div>

        {/* Size */}
        <div className="flex items-center gap-2">
          <span className="text-xs">Size:</span>
          <input
            type="range"
            min="1"
            max="20"
            value={state.size}
            onChange={(e) => setState(prev => ({ ...prev, size: parseInt(e.target.value) }))}
            className="w-16"
          />
          <span className="text-xs w-8">{state.size}px</span>
        </div>

        {/* Colors */}
        {state.tool === 'pen' && (
          <div className="flex gap-1">
            {colors.map(color => (
              <button
                key={color}
                onClick={() => setState(prev => ({ ...prev, color }))}
                className={`w-6 h-6 rounded border-2 ${state.color === color ? 'border-neutral-800' : 'border-neutral-300'}`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-1 ml-auto">
          <button
            onClick={undo}
            disabled={state.historyIndex <= 0}
            className="p-2 rounded bg-white disabled:opacity-50"
          >
            <Undo className="w-4 h-4" />
          </button>
          <button
            onClick={redo}
            disabled={state.historyIndex >= state.history.length - 1}
            className="p-2 rounded bg-white disabled:opacity-50"
          >
            <Redo className="w-4 h-4" />
          </button>
          <button onClick={download} className="p-2 rounded bg-white">
            <Download className="w-4 h-4" />
          </button>
          <button onClick={clear} className="p-2 rounded bg-white text-red-600">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="border border-neutral-300 rounded-lg cursor-crosshair bg-white"
        style={{ maxWidth: '100%', height: 'auto' }}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
      />
    </div>
  );
};

export default FlatDraw;