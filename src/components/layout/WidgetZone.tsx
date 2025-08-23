import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useLayoutStore } from '../../store/layoutStore';
import { WidgetZone as WidgetZoneType } from '../../types';
import { Button } from '../ui/Button';
import { WidgetContainer } from './WidgetContainer';

interface WidgetZoneProps {
  zone: WidgetZoneType;
  className?: string;
}

export const WidgetZone: React.FC<WidgetZoneProps> = ({ zone, className }) => {
  const { 
    getWidgetsByZone, 
    isZoneCollapsed, 
    toggleZoneCollapsed, 
    addWidget,
    layoutConfig 
  } = useLayoutStore();

  const widgets = getWidgetsByZone(zone);
  const isCollapsed = isZoneCollapsed(zone);
  
  const getZoneSize = () => {
    switch (zone) {
      case 'top':
        return layoutConfig.topZoneHeight;
      case 'bottom':
        return layoutConfig.bottomZoneHeight;
      case 'left':
        return layoutConfig.leftZoneWidth;
      case 'right':
        return layoutConfig.rightZoneWidth;
      default:
        return 25;
    }
  };

  const getCollapsedSize = () => {
    return zone === 'top' || zone === 'bottom' ? '40px' : '40px';
  };

  const getExpandedSize = () => {
    const size = getZoneSize();
    return zone === 'top' || zone === 'bottom' ? `${size}vh` : `${size}vw`;
  };

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

  const isVertical = zone === 'top' || zone === 'bottom';

  return (
    <motion.div
      className={`bg-gray-50 border-gray-200 ${className}`}
      style={{
        [isVertical ? 'height' : 'width']: isCollapsed ? getCollapsedSize() : getExpandedSize(),
        minHeight: isVertical ? getCollapsedSize() : 'auto',
        minWidth: !isVertical ? getCollapsedSize() : 'auto',
      }}
      animate={{
        [isVertical ? 'height' : 'width']: isCollapsed ? getCollapsedSize() : getExpandedSize(),
      }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
    >
      {/* Zone Header */}
      <div className={`flex items-center justify-between p-2 bg-gray-100 border-gray-200 ${
        isVertical ? 'border-b' : 'border-r h-full'
      } ${isVertical ? 'flex-row' : 'flex-col'}`}>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => toggleZoneCollapsed(zone)}
          className="p-1"
        >
          {getCollapseIcon()}
        </Button>

        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className={isVertical ? '' : 'transform -rotate-90'}
            >
              <span className="text-xs font-medium text-gray-600 capitalize">
                {zone}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {!isCollapsed && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => addWidget('empty', zone)}
            className="p-1"
          >
            <Plus className="w-3 h-3" />
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
            className={`p-4 overflow-auto ${
              isVertical 
                ? 'flex flex-wrap gap-4' 
                : 'flex flex-col space-y-4 h-full'
            }`}
            style={{
              height: isVertical ? 'calc(100% - 40px)' : 'auto',
              width: !isVertical ? 'calc(100% - 40px)' : 'auto',
            }}
          >
            {widgets.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <div className="text-2xl mb-2">📝</div>
                  <p className="text-sm">No widgets yet</p>
                  <p className="text-xs">Click + to add one</p>
                </div>
              </div>
            ) : (
              widgets.map(widget => (
                <WidgetContainer
                  key={widget.id}
                  widget={widget}
                  className={isVertical ? 'flex-1 min-w-0' : 'w-full'}
                />
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};