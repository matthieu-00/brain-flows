import React, { useState } from 'react';
import { Trash2, History } from 'lucide-react';
import { motion } from 'framer-motion';
import { Widget } from '../../types';
import { useLayoutStore } from '../../store/layoutStore';
import { Button } from '../ui/Button';

interface CalculatorWidgetProps {
  widget: Widget;
}

const CalculatorWidget: React.FC<CalculatorWidgetProps> = ({ widget }) => {
  const { updateWidget } = useLayoutStore();
  
  const [display, setDisplay] = useState('0');
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const history: string[] = widget.data?.history || [];

  const addToHistory = (calculation: string) => {
    const newHistory = [calculation, ...history.slice(0, 9)]; // Keep last 10 calculations
    updateWidget(widget.id, {
      data: { ...widget.data, history: newHistory }
    });
  };

  const inputNumber = (num: string) => {
    if (waitingForOperand) {
      setDisplay(String(num));
      setWaitingForOperand(false);
    } else {
      setDisplay(display === '0' ? String(num) : display + num);
    }
  };

  const inputDecimal = () => {
    if (waitingForOperand) {
      setDisplay('0.');
      setWaitingForOperand(false);
    } else if (display.indexOf('.') === -1) {
      setDisplay(display + '.');
    }
  };

  const clear = () => {
    setDisplay('0');
    setPreviousValue(null);
    setOperation(null);
    setWaitingForOperand(false);
  };

  const performOperation = (nextOperation: string) => {
    const inputValue = parseFloat(display);

    if (previousValue === null) {
      setPreviousValue(inputValue);
    } else if (operation) {
      const currentValue = previousValue || 0;
      let result: number;

      switch (operation) {
        case '+':
          result = currentValue + inputValue;
          break;
        case '-':
          result = currentValue - inputValue;
          break;
        case '×':
          result = currentValue * inputValue;
          break;
        case '÷':
          result = currentValue / inputValue;
          break;
        case '%':
          result = currentValue % inputValue;
          break;
        default:
          return;
      }

      // Add to history
      const calculation = `${currentValue} ${operation} ${inputValue} = ${result}`;
      addToHistory(calculation);

      setDisplay(String(result));
      setPreviousValue(result);
    }

    setWaitingForOperand(true);
    setOperation(nextOperation);
  };

  const calculate = () => {
    performOperation('=');
    setOperation(null);
    setPreviousValue(null);
    setWaitingForOperand(true);
  };

  const buttons = [
    ['C', '±', '%', '÷'],
    ['7', '8', '9', '×'],
    ['4', '5', '6', '-'],
    ['1', '2', '3', '+'],
    ['0', '.', '='],
  ];

  const getButtonVariant = (button: string) => {
    if (['C', '±', '%'].includes(button)) return 'secondary';
    if (['÷', '×', '-', '+', '='].includes(button)) return 'primary';
    return 'outline';
  };

  const handleButtonClick = (button: string) => {
    switch (button) {
      case 'C':
        clear();
        break;
      case '±':
        setDisplay(String(parseFloat(display) * -1));
        break;
      case '%':
      case '÷':
      case '×':
      case '-':
      case '+':
        performOperation(button);
        break;
      case '=':
        calculate();
        break;
      case '.':
        inputDecimal();
        break;
      default:
        inputNumber(button);
        break;
    }
  };

  return (
    <div className="space-y-4">
      {/* Display */}
      <div className="bg-gray-900 text-white p-4 rounded-lg">
        <div className="text-right">
          <div className="text-2xl font-mono font-bold truncate">
            {display}
          </div>
          {operation && previousValue !== null && (
            <div className="text-sm text-gray-400 mt-1">
              {previousValue} {operation}
            </div>
          )}
        </div>
      </div>

      {/* History Toggle */}
      <div className="flex justify-between items-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowHistory(!showHistory)}
          className="p-2"
        >
          <History className="w-4 h-4 mr-1" />
          History
        </Button>
        
        {history.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => updateWidget(widget.id, { data: { ...widget.data, history: [] } })}
            className="p-2 text-red-600"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* History Panel */}
      {showHistory && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="bg-gray-50 rounded-lg p-3 max-h-32 overflow-y-auto"
        >
          {history.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-2">No calculations yet</p>
          ) : (
            <div className="space-y-1">
              {history.map((calculation, index) => (
                <div key={index} className="text-xs font-mono text-gray-700">
                  {calculation}
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Calculator Buttons */}
      <div className="grid gap-2">
        {buttons.map((row, rowIndex) => (
          <div key={rowIndex} className="grid grid-cols-4 gap-2">
            {row.map((button) => (
              <Button
                key={button}
                variant={getButtonVariant(button)}
                size="sm"
                onClick={() => handleButtonClick(button)}
                className={`h-10 text-lg font-semibold ${
                  button === '0' ? 'col-span-2' : ''
                } ${button === '=' ? 'col-span-2' : ''}`}
              >
                {button}
              </Button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CalculatorWidget;