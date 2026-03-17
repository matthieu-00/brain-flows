import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Widget } from '../../types';
import { Button } from '../ui/Button';

interface FidgetToolsWidgetProps {
  widget: Widget;
}

const FidgetToolsWidget: React.FC<FidgetToolsWidgetProps> = ({ widget }) => {
  const [activeTool, setActiveTool] = useState<'spinner' | 'clicker' | 'bubbles'>('spinner');
  const [clickCount, setClickCount] = useState(0);
  const [spinnerRotation, setSpinnerRotation] = useState(0);
  const [poppedBubbles, setPoppedBubbles] = useState<Set<number>>(new Set());

  const handleSpinnerClick = () => {
    setSpinnerRotation(prev => prev + 360);
  };

  const handleClickerClick = () => {
    setClickCount(prev => prev + 1);
  };

  const popBubble = (id: number) => {
    setPoppedBubbles(prev => new Set(prev).add(id));
    setTimeout(() => {
      setPoppedBubbles(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }, 2000);
  };

  const resetClicker = () => {
    setClickCount(0);
  };

  const tools = [
    { id: 'spinner', name: 'Fidget Spinner', icon: '🌀' },
    { id: 'clicker', name: 'Stress Clicker', icon: '🎯' },
    { id: 'bubbles', name: 'Bubble Wrap', icon: '🫧' },
  ];

  return (
    <div className="space-y-4">
      {/* Tool Selection */}
      <div className="flex justify-center space-x-2">
        {tools.map((tool) => (
          <Button
            key={tool.id}
            variant={activeTool === tool.id ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setActiveTool(tool.id as any)}
            className="flex items-center space-x-1"
          >
            <span>{tool.icon}</span>
            <span className="text-xs">{tool.name}</span>
          </Button>
        ))}
      </div>

      {/* Fidget Spinner */}
      {activeTool === 'spinner' && (
        <div className="text-center py-8">
          <motion.div
            className="w-20 h-20 mx-auto cursor-pointer"
            animate={{ rotate: spinnerRotation }}
            transition={{ duration: 2, ease: 'easeOut' }}
            onClick={handleSpinnerClick}
          >
            <div className="relative">
              {/* Center circle */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-neutral-900 dark:bg-neutral-text rounded-full z-10"></div>
              
              {/* Spinner arms */}
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-6 h-6 bg-blue-500 rounded-full"></div>
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-6 h-6 bg-red-500 rounded-full"></div>
              <div className="absolute top-1/2 left-0 transform -translate-y-1/2 w-6 h-6 bg-green-500 rounded-full"></div>
              <div className="absolute top-1/2 right-0 transform -translate-y-1/2 w-6 h-6 bg-yellow-500 rounded-full"></div>
            </div>
          </motion.div>
          <p className="text-sm text-neutral-600 dark:text-neutral-textMuted mt-4">Click to spin!</p>
        </div>
      )}

      {/* Stress Clicker */}
      {activeTool === 'clicker' && (
        <div className="text-center py-8">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleClickerClick}
            className="w-24 h-24 mx-auto bg-gradient-to-br from-orange-400 to-red-500 rounded-full shadow-lg flex items-center justify-center text-white font-bold text-lg"
          >
            CLICK
          </motion.button>
          
          <div className="mt-4 space-y-2">
            <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-text">
              {clickCount}
            </div>
            <div className="text-sm text-neutral-600 dark:text-neutral-textMuted">
              clicks
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={resetClicker}
              className="text-xs"
            >
              Reset Counter
            </Button>
          </div>
        </div>
      )}

      {/* Bubble Wrap */}
      {activeTool === 'bubbles' && (
        <div className="py-4">
          <div className="grid grid-cols-6 gap-1">
            {Array.from({ length: 24 }, (_, i) => (
              <motion.button
                key={i}
                className={`w-8 h-8 rounded-full ${
                  poppedBubbles.has(i) 
                    ? 'bg-neutral-300 dark:bg-neutral-600' 
                    : 'bg-gradient-to-br from-blue-200 to-blue-400 shadow-inner'
                } transition-colors`}
                whileTap={{ scale: 0.8 }}
                onClick={() => !poppedBubbles.has(i) && popBubble(i)}
                disabled={poppedBubbles.has(i)}
              >
                {poppedBubbles.has(i) ? '💥' : ''}
              </motion.button>
            ))}
          </div>
          
          <div className="text-center mt-4">
            <p className="text-sm text-neutral-600 dark:text-neutral-textMuted">
              Popped: {poppedBubbles.size}/24 bubbles
            </p>
            {poppedBubbles.size === 24 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-lg mt-2"
              >
                🎉 All popped! They'll refill soon...
              </motion.div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FidgetToolsWidget;