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
      case 'top': return 'absolute top-2 right-2';
      case 'bottom': return 'absolute top-2 right-2';
      case 'left': return 'absolute top-2 left-2';
      case 'right': return 'absolute top-2 right-2';
      default: return 'absolute top-2 right-2';
    }
  };

  const getHeaderLayout = () => {
    switch (zone) {
      case 'top':
      case 'bottom':
        return 'flex-row items-center justify-end space-x-1';
      case 'left':
        return 'flex-col items-start justify-start space-y-1';
      case 'right':
        return 'flex-col items-end justify-start space-y-1';
      default:
        return 'flex-row items-center justify-end space-x-1';
    }
  };

  const getHeaderVisibility = () => {
    if (isCollapsed) {
      return 'opacity-100 bg-sage-200 border border-sage-300 shadow-sm';
    } else {
      return 'opacity-0 group-hover:opacity-100 group-hover:bg-neutral-100 group-hover:border group-hover:border-neutral-300 group-hover:shadow-sm';
    }
  };

  return (
    <div className={`h-full bg-cream-100 border-neutral-300 relative group ${className}`}>
      {/* Floating Header with Controls */}
      <div className={`
        ${getHeaderPosition()}
        ${getHeaderVisibility()}
        transition-all duration-200 ease-in-out
        rounded-lg z-10
        flex ${getHeaderLayout()}
        p-1
      `}>
        {/* Collapse/Expand Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => toggleZoneCollapsed(zone)}
          className="w-8 h-8 p-0 flex items-center justify-center hover:bg-neutral-200"
          title={isCollapsed ? `Expand ${zone} zone` : `Collapse ${zone} zone`}
        >
          {getCollapseIcon()}
        </Button>

        {/* Add Widget Button - Only show when expanded */}
        {!isCollapsed && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openWidgetModal('add', zone)}
            className="w-8 h-8 p-0 flex items-center justify-center hover:bg-sage-200 text-sage-700"
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