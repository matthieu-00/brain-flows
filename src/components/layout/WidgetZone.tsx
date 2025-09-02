import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useLayoutStore } from '../../store/layoutStore';
import { useUIStore } from '../../store/uiStore';
import { WidgetZone as WidgetZoneType } from '../../types';
import { Button } from '../ui/Button';
import { WidgetContainer } from './WidgetContainer';

interface WidgetZoneProps {
  zone: WidgetZoneType;
  className?: string;
}

export const WidgetZone: React.FC<WidgetZoneProps> = ({ zone, className }) => {
  const { getWidgetsByZone, isZoneCollapsed, toggleZoneCollapsed } = useLayoutStore();
  const { openWidgetModal } = useUIStore();

  const widgets = getWidgetsByZone(zone);
  const isCollapsed = isZoneCollapsed(zone);
  const isVertical = zone === 'top' || zone === 'bottom';
  
  const getCollapseIcon = () => {
    if (isCollapsed) {
      switch (zone) {
        case 'top': return <ChevronDown className="w-4 h-4" />;
        case 'bottom': return <ChevronUp className="w-4 h-4" />;
        case 'left': return <ChevronRight className="w-4 h-4" />;
        case 'right': return <ChevronLeft className="w-4 h-4" />;
        default: return <Plus className="w-4 h-4" />;
      }
    } else {
      switch (zone) {
        case 'top': return <ChevronUp className="w-4 h-4" />;
        case 'bottom': return <ChevronDown className="w-4 h-4" />;
        case 'left': return <ChevronLeft className="w-4 h-4" />;
        case 'right': return <ChevronRight className="w-4 h-4" />;
        default: return <ChevronUp className="w-4 h-4" />;
      }
    }
  };

  return (
    <div className={`h-full bg-cream-100 border-neutral-300 relative ${className}`}>
      {/* Zone Header */}
      <div className={`${
        isVertical 
          ? 'h-12 flex items-center justify-between px-4 bg-neutral-100 border-b border-neutral-300' 
          : 'w-12 flex flex-col items-center justify-between py-4 bg-neutral-100 border-r border-neutral-300'
      } z-10`}>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => toggleZoneCollapsed(zone)}
          className="p-2 hover:bg-neutral-200"
        >
          {getCollapseIcon()}
        </Button>

        {!isCollapsed && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openWidgetModal('add', zone)}
            className="p-2 hover:bg-sage-200 text-sage-700"
            title={`Add widget to ${zone} zone`}
          >
            <Plus className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Zone Content */}
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`${
              isVertical 
                ? 'h-full pt-12 px-4 pb-4 overflow-auto' 
                : 'h-full pl-12 py-4 pr-4 overflow-auto'
            }`}
          >
            {widgets.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-neutral-400">
                  <div className="text-4xl mb-2">📦</div>
                  <p className="text-sm">No widgets</p>
                  <p className="text-xs">Use + button above</p>
                </div>
              </div>
            ) : (
              <div className={`${
                isVertical 
                  ? 'flex flex-wrap gap-4' 
                  : 'space-y-4'
              }`}>
                {widgets.map(widget => (
                  <WidgetContainer
                    key={widget.id}
                    widget={widget}
                    className={isVertical ? 'flex-1 min-w-80' : 'w-full'}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};