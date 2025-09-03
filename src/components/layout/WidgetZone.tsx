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

  const getHeaderPosition = () => {
    switch (zone) {
      case 'top': return 'absolute top-0 right-0';
      case 'bottom': return 'absolute top-0 right-0';
      case 'left': return 'absolute top-0 left-0';
      case 'right': return 'absolute top-0 right-0';
      default: return 'absolute top-0 right-0';
    }
  };

  const getHeaderLayout = () => {
    if (isVertical) {
      return 'flex-row items-center justify-end';
    } else {
      return zone === 'left' ? 'flex-col items-center justify-start' : 'flex-col items-center justify-start';
    }
  };

  const getHeaderVisibility = () => {
    if (isCollapsed) {
      return 'opacity-100 bg-neutral-100 border border-neutral-300';
    } else {
      return 'opacity-0 group-hover:opacity-100 group-hover:bg-neutral-100 group-hover:border group-hover:border-neutral-300';
    }
  };

  return (
    <div className={`h-full bg-cream-100 border-neutral-300 relative group ${className}`}>
      {/* Floating Header with Controls */}
      <div className={`
        ${getHeaderPosition()}
        w-12 h-12 
        ${getHeaderVisibility()}
        transition-all duration-200 ease-in-out
        rounded-lg m-2 z-10
        flex ${getHeaderLayout()}
      `}>
        {/* Collapse/Expand Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => toggleZoneCollapsed(zone)}
          className="p-2 hover:bg-neutral-200 w-8 h-8"
        >
          {getCollapseIcon()}
        </Button>

        {/* Add Widget Button - Only show when expanded */}
        {!isCollapsed && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openWidgetModal('add', zone)}
            className="p-2 hover:bg-sage-200 text-sage-700 w-8 h-8"
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
            className="h-full p-4 overflow-auto"
          >
            {widgets.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-neutral-400">
                  <div className="text-4xl mb-2">📦</div>
                  <p className="text-sm">No widgets</p>
                  <p className="text-xs">Hover and use + button</p>
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