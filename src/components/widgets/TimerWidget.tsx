import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Pause, RotateCcw, Plus, Minus } from 'lucide-react';
import { Button } from '../ui/Button';
import { useLayoutStore } from '../../store/layoutStore';
import { Widget } from '../../types';

interface TimerWidgetProps {
  widget: Widget;
}

interface TimerData {
  /** Wall-clock timestamp (ms) when timer should reach zero. Null when paused. */
  endAt: number | null;
  /** Remaining seconds when paused (or initial duration). */
  remainingSeconds: number;
  /** The original configured duration so we can reset. */
  originalTime: number;
}

const DEFAULT_DURATION = 300; // 5 minutes

function getInitial(widget: Widget): { endAt: number | null; remaining: number; original: number } {
  const d = widget.data as TimerData | undefined;
  if (!d) return { endAt: null, remaining: DEFAULT_DURATION, original: DEFAULT_DURATION };
  const remaining = d.endAt ? Math.max(0, Math.round((d.endAt - Date.now()) / 1000)) : (d.remainingSeconds ?? DEFAULT_DURATION);
  return { endAt: d.endAt ?? null, remaining, original: d.originalTime ?? DEFAULT_DURATION };
}

const TimerWidget: React.FC<TimerWidgetProps> = ({ widget }) => {
  const { updateWidget } = useLayoutStore();
  const initRef = useRef(getInitial(widget));

  const [remaining, setRemaining] = useState(initRef.current.remaining);
  const [isRunning, setIsRunning] = useState(initRef.current.endAt !== null && initRef.current.remaining > 0);
  const [originalTime, setOriginalTime] = useState(initRef.current.original);

  const persist = useCallback((data: Partial<TimerData>) => {
    const current = (widget.data as TimerData) || {};
    updateWidget(widget.id, { data: { ...current, ...data } });
  }, [widget.id, updateWidget, widget.data]);

  // Tick effect: derive remaining from wall clock
  useEffect(() => {
    if (!isRunning) return;

    const tick = () => {
      const d = widget.data as TimerData | undefined;
      if (!d?.endAt) return;
      const left = Math.max(0, Math.round((d.endAt - Date.now()) / 1000));
      setRemaining(left);
      if (left === 0) {
        setIsRunning(false);
        persist({ endAt: null, remainingSeconds: 0 });
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Timer Finished!', { body: 'Your timer has reached zero.', icon: '/favicon.ico' });
        }
      }
    };

    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [isRunning, widget.data, persist]);

  const toggleTimer = () => {
    if (isRunning) {
      // Pause: snapshot remaining seconds
      const d = widget.data as TimerData | undefined;
      const left = d?.endAt ? Math.max(0, Math.round((d.endAt - Date.now()) / 1000)) : remaining;
      setRemaining(left);
      setIsRunning(false);
      persist({ endAt: null, remainingSeconds: left });
    } else {
      if (remaining <= 0) return;
      const endAt = Date.now() + remaining * 1000;
      setIsRunning(true);
      persist({ endAt, remainingSeconds: remaining, originalTime });
    }
  };

  const resetTimer = () => {
    setRemaining(originalTime);
    setIsRunning(false);
    persist({ endAt: null, remainingSeconds: originalTime, originalTime });
  };

  const adjustTime = (adjustment: number) => {
    if (isRunning) return;
    const newTotal = Math.max(0, remaining + adjustment);
    setRemaining(newTotal);
    setOriginalTime(newTotal);
    persist({ endAt: null, remainingSeconds: newTotal, originalTime: newTotal });
  };

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;

  const formatTime = (mins: number, secs: number) =>
    `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

  const getProgressPercentage = () =>
    originalTime > 0 ? ((originalTime - remaining) / originalTime) * 100 : 0;

  return (
    <div className="flex flex-col items-center justify-center h-full space-y-6">
        {/* Progress Ring */}
        <div className="relative w-32 h-32">
          <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
            <circle
              cx="60"
              cy="60"
              r="50"
              stroke="var(--color-border-default)"
              strokeWidth="8"
              fill="none"
            />
            <circle
              cx="60"
              cy="60"
              r="50"
              stroke="var(--color-accent)"
              strokeWidth="8"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 50}`}
              strokeDashoffset={`${2 * Math.PI * 50 * (1 - getProgressPercentage() / 100)}`}
              className="transition-all duration-1000 ease-linear"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-bold text-neutral-900 dark:text-neutral-text">
              {formatTime(minutes, seconds)}
            </span>
          </div>
        </div>

        {/* Time Adjustment */}
        {!isRunning && (
          <div className="flex items-center gap-2 mb-4">
            <Button
              onClick={() => adjustTime(-60)}
              variant="secondary"
              className="p-2"
              disabled={remaining <= 0}
            >
              <Minus className="w-4 h-4" />
            </Button>
            <span className="text-sm text-neutral-600 dark:text-neutral-textMuted min-w-16 text-center">
              {Math.floor(remaining / 60)}m
            </span>
            <Button
              onClick={() => adjustTime(60)}
              variant="secondary"
              className="p-2"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center gap-3">
          <Button
            onClick={toggleTimer}
            disabled={remaining === 0}
            className="px-6 py-2"
          >
            {isRunning ? (
              <>
                <Pause className="w-4 h-4 mr-2" />
                Pause
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Start
              </>
            )}
          </Button>
          
          <Button
            onClick={resetTimer}
            variant="secondary"
            className="p-2"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>

        {/* Status */}
        {remaining === 0 && (
          <div className="mt-4 p-3 bg-sage-100 rounded-lg">
            <p className="text-sm font-medium text-sage-900 text-center">
              Time's up! 🎉
            </p>
          </div>
        )}
    </div>
  );
};

export default TimerWidget;