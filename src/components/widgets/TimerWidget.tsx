import React, { useState, useEffect, useCallback } from 'react';
import { Play, Pause, RotateCcw, Plus, Minus } from 'lucide-react';
import { Button } from '../ui/Button';
import { useLayoutStore } from '../../store/layoutStore';
import { Widget } from '../../types';

interface TimerWidgetProps {
  widget: Widget;
}

interface TimerData {
  minutes: number;
  seconds: number;
  isRunning: boolean;
  totalSeconds: number;
  originalTime: number;
}

const TimerWidget: React.FC<TimerWidgetProps> = ({ widget }) => {
  const { updateWidget } = useLayoutStore();
  
  const [minutes, setMinutes] = useState(5);
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [totalSeconds, setTotalSeconds] = useState(300); // 5 minutes default

  // Load saved state
  useEffect(() => {
    const savedData = widget.data as TimerData;
    if (savedData) {
      setMinutes(savedData.minutes || 5);
      setSeconds(savedData.seconds || 0);
      setIsRunning(savedData.isRunning || false);
      setTotalSeconds(savedData.totalSeconds || 300);
    }
  }, [widget.data]);

  // Save state
  const saveState = useCallback((data: Partial<TimerData>) => {
    const currentData = widget.data as TimerData || {};
    updateWidget(widget.id, {
      data: { ...currentData, ...data }
    });
  }, [widget.id, updateWidget]);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning && totalSeconds > 0) {
      interval = setInterval(() => {
        setTotalSeconds(prev => {
          const newTotal = prev - 1;
          const newMinutes = Math.floor(newTotal / 60);
          const newSeconds = newTotal % 60;
          
          setMinutes(newMinutes);
          setSeconds(newSeconds);
          
          // Save state
          saveState({
            minutes: newMinutes,
            seconds: newSeconds,
            totalSeconds: newTotal,
            isRunning: newTotal > 0
          });
          
          // Timer finished
          if (newTotal === 0) {
            setIsRunning(false);
            // Show notification if supported
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('Timer Finished!', {
                body: 'Your timer has reached zero.',
                icon: '/favicon.ico'
              });
            }
          }
          
          return newTotal;
        });
      }, 1000);
    }
    
    return () => clearInterval(interval);
  }, [isRunning, totalSeconds, saveState]);

  const toggleTimer = () => {
    const newRunning = !isRunning;
    setIsRunning(newRunning);
    saveState({ isRunning: newRunning });
  };

  const resetTimer = () => {
    const originalTime = (widget.data as TimerData)?.originalTime || 300;
    const newMinutes = Math.floor(originalTime / 60);
    const newSeconds = originalTime % 60;
    
    setMinutes(newMinutes);
    setSeconds(newSeconds);
    setTotalSeconds(originalTime);
    setIsRunning(false);
    
    saveState({
      minutes: newMinutes,
      seconds: newSeconds,
      totalSeconds: originalTime,
      isRunning: false
    });
  };

  const adjustTime = (adjustment: number) => {
    if (isRunning) return;
    
    const newTotal = Math.max(0, totalSeconds + adjustment);
    const newMinutes = Math.floor(newTotal / 60);
    const newSeconds = newTotal % 60;
    
    setMinutes(newMinutes);
    setSeconds(newSeconds);
    setTotalSeconds(newTotal);
    
    saveState({
      minutes: newMinutes,
      seconds: newSeconds,
      totalSeconds: newTotal,
      originalTime: newTotal
    });
  };

  const formatTime = (mins: number, secs: number) => {
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = () => {
    const originalTime = (widget.data as TimerData)?.originalTime || 300;
    return ((originalTime - totalSeconds) / originalTime) * 100;
  };

  return (
    <div className="flex flex-col items-center justify-center h-full space-y-6">
        {/* Progress Ring */}
        <div className="relative w-32 h-32">
          <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
            <circle
              cx="60"
              cy="60"
              r="50"
              stroke="#E5E7EB"
              strokeWidth="8"
              fill="none"
            />
            <circle
              cx="60"
              cy="60"
              r="50"
              stroke="#2D5A3D"
              strokeWidth="8"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 50}`}
              strokeDashoffset={`${2 * Math.PI * 50 * (1 - getProgressPercentage() / 100)}`}
              className="transition-all duration-1000 ease-linear"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-bold text-neutral-900">
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
              disabled={totalSeconds <= 0}
            >
              <Minus className="w-4 h-4" />
            </Button>
            <span className="text-sm text-neutral-600 min-w-16 text-center">
              {Math.floor(totalSeconds / 60)}m
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
            disabled={totalSeconds === 0}
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
        {totalSeconds === 0 && (
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