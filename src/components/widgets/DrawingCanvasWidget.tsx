import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Widget } from '../../types';
import { useLayoutStore } from '../../store/layoutStore';
import { Button } from '../ui/Button';
import { Pencil, Eraser, Download, Trash2, Undo2, Redo2 } from 'lucide-react';

interface DrawingCanvasWidgetProps {
  widget: Widget;
}

interface Point {
  x: number;
  y: number;
}

interface Stroke {
  points: Point[];
  color: string;
  width: number;
  tool: 'pen' | 'eraser';
}

const COLOR_SWATCHES = [
  { color: '#1a1a1a', label: 'Black' },
  { color: '#dc2626', label: 'Red' },
  { color: '#2563eb', label: 'Blue' },
  { color: '#f97316', label: 'Orange' },
  { color: '#7c3aed', label: 'Purple' },
  { color: '#16a34a', label: 'Green' },
  { color: '#4A7C59', label: 'Sage' },
  { color: '#6B8F71', label: 'Sage Light' },
];

const ASPECT_RATIO = 1.4;

const DrawingCanvasWidget: React.FC<DrawingCanvasWidgetProps> = ({ widget }) => {
  const { updateWidget } = useLayoutStore();

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const currentStrokeRef = useRef<Stroke | null>(null);

  const [canvasSize, setCanvasSize] = useState({ width: 500, height: Math.round(500 / ASPECT_RATIO) });
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
  const [color, setColor] = useState('#1a1a1a');
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [redoStack, setRedoStack] = useState<Stroke[]>([]);
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        const w = Math.floor(entry.contentRect.width);
        const h = Math.floor(entry.contentRect.height);
        if (w <= 0 || h <= 0) return;
        // Fit canvas in container while keeping aspect ratio (width / height = ASPECT_RATIO).
        const heightFromWidth = w / ASPECT_RATIO;
        const widthFromHeight = h * ASPECT_RATIO;
        if (heightFromWidth <= h) {
          setCanvasSize({ width: w, height: Math.round(heightFromWidth) });
        } else {
          setCanvasSize({ width: Math.round(widthFromHeight), height: h });
        }
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (initialDataLoaded) return;
    const saved = widget.data?.drawing as string | undefined;
    if (saved && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        setInitialDataLoaded(true);
      };
      img.src = saved;
    } else {
      setInitialDataLoaded(true);
    }
  }, [widget.data?.drawing, initialDataLoaded, canvasSize]);

  const redrawCanvas = useCallback(
    (strokesToDraw: Stroke[]) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const stroke of strokesToDraw) {
        if (stroke.points.length < 2) continue;
        ctx.beginPath();
        ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
        for (let i = 1; i < stroke.points.length; i++) {
          ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
        }
        ctx.strokeStyle = stroke.tool === 'eraser' ? '#ffffff' : stroke.color;
        ctx.lineWidth = stroke.tool === 'eraser' ? stroke.width * 3 : stroke.width;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.globalCompositeOperation =
          stroke.tool === 'eraser' ? 'destination-out' : 'source-over';
        ctx.stroke();
      }
      ctx.globalCompositeOperation = 'source-over';
    },
    []
  );

  const saveDrawing = useCallback(() => {
    if (!canvasRef.current) return;
    const dataUrl = canvasRef.current.toDataURL('image/png');
    updateWidget(widget.id, {
      data: { ...widget.data, drawing: dataUrl },
    });
  }, [widget.id, widget.data, updateWidget]);

  const getPointerPos = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>): Point => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    },
    []
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      isDrawingRef.current = true;
      const point = getPointerPos(e);
      currentStrokeRef.current = {
        points: [point],
        color,
        width: strokeWidth,
        tool,
      };

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.beginPath();
      ctx.moveTo(point.x, point.y);
      ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : color;
      ctx.lineWidth = tool === 'eraser' ? strokeWidth * 3 : strokeWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalCompositeOperation =
        tool === 'eraser' ? 'destination-out' : 'source-over';
    },
    [color, strokeWidth, tool, getPointerPos]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!isDrawingRef.current || !currentStrokeRef.current) return;
      const point = getPointerPos(e);
      currentStrokeRef.current.points.push(point);

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.lineTo(point.x, point.y);
      ctx.stroke();
    },
    [getPointerPos]
  );

  const handlePointerUp = useCallback(() => {
    if (!isDrawingRef.current || !currentStrokeRef.current) return;
    isDrawingRef.current = false;

    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.globalCompositeOperation = 'source-over';
    }

    const finishedStroke = currentStrokeRef.current;
    currentStrokeRef.current = null;
    if (finishedStroke.points.length >= 2) {
      setStrokes(prev => {
        const next = [...prev, finishedStroke];
        return next;
      });
      setRedoStack([]);
    }

    setTimeout(saveDrawing, 50);
  }, [saveDrawing]);

  const undo = useCallback(() => {
    setStrokes(prev => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      setRedoStack(rs => [...rs, last]);
      const next = prev.slice(0, -1);
      redrawCanvas(next);
      setTimeout(saveDrawing, 50);
      return next;
    });
  }, [redrawCanvas, saveDrawing]);

  const redo = useCallback(() => {
    setRedoStack(prev => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      setStrokes(ss => {
        const next = [...ss, last];
        redrawCanvas(next);
        setTimeout(saveDrawing, 50);
        return next;
      });
      return prev.slice(0, -1);
    });
  }, [redrawCanvas, saveDrawing]);

  const clearCanvas = useCallback(() => {
    setStrokes([]);
    setRedoStack([]);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    setTimeout(saveDrawing, 50);
  }, [saveDrawing]);

  const downloadPng = useCallback(() => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = 'drawing.png';
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  }, []);

  return (
    <div className="w-full h-full min-h-0 flex flex-col overflow-hidden font-body">
      {/* Toolbar */}
      <div className="shrink-0 flex flex-wrap items-center gap-2 mb-3 p-2.5 bg-neutral-50 dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
        {/* Tools */}
        <div className="flex gap-1">
          <button
            onClick={() => setTool('pen')}
            className={`p-2 rounded-lg transition-colors ${
              tool === 'pen'
                ? 'bg-sage-700 text-white dark:bg-sage-600'
                : 'bg-white dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-600'
            }`}
            title="Pen"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => setTool('eraser')}
            className={`p-2 rounded-lg transition-colors ${
              tool === 'eraser'
                ? 'bg-sage-700 text-white dark:bg-sage-600'
                : 'bg-white dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-600'
            }`}
            title="Eraser"
          >
            <Eraser className="w-4 h-4" />
          </button>
        </div>

        {/* Stroke Width */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-neutral-500 dark:text-neutral-400">
            {strokeWidth}px
          </span>
          <input
            type="range"
            min="1"
            max="20"
            value={strokeWidth}
            onChange={e => setStrokeWidth(parseInt(e.target.value))}
            className="w-16 accent-sage-700 dark:accent-sage-500"
          />
        </div>

        {/* Color Swatches */}
        {tool === 'pen' && (
          <div className="flex gap-1 flex-wrap">
            {COLOR_SWATCHES.map(swatch => (
              <button
                key={swatch.color}
                onClick={() => setColor(swatch.color)}
                className={`w-6 h-6 rounded-full border-2 transition-all ${
                  color === swatch.color
                    ? 'border-sage-700 dark:border-sage-400 ring-2 ring-sage-300 dark:ring-sage-600'
                    : 'border-neutral-300 dark:border-neutral-600'
                }`}
                style={{ backgroundColor: swatch.color }}
                title={swatch.label}
              />
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-1 ml-auto">
          <button
            onClick={undo}
            disabled={strokes.length === 0}
            className="p-2 rounded-lg bg-white dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="Undo"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={redo}
            disabled={redoStack.length === 0}
            className="p-2 rounded-lg bg-white dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="Redo"
          >
            <Redo2 className="w-4 h-4" />
          </button>
          <button
            onClick={downloadPng}
            className="p-2 rounded-lg bg-white dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-600 transition-colors"
            title="Download as PNG"
          >
            <Download className="w-4 h-4" />
          </button>
          <Button onClick={clearCanvas} variant="ghost" size="sm" title="Clear">
            <Trash2 className="w-4 h-4 text-red-500" />
          </Button>
        </div>
      </div>

      {/* Canvas */}
      <div ref={containerRef} className="flex-1 min-h-0 w-full flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={canvasSize.width}
          height={canvasSize.height}
          className="border border-neutral-200 dark:border-neutral-700 rounded-lg cursor-crosshair bg-white dark:bg-neutral-900 touch-none"
          style={{ width: '100%', height: 'auto' }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        />
      </div>
    </div>
  );
};

export default DrawingCanvasWidget;
