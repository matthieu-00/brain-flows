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

const EmptyStateIcon: React.FC = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path opacity=".05" d="M6.78296 13.376C8.73904 9.95284 8.73904 5.04719 6.78296 1.62405L7.21708 1.37598C9.261 4.95283 9.261 10.0472 7.21708 13.624L6.78296 13.376Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
    <path opacity=".1" d="M7.28204 13.4775C9.23929 9.99523 9.23929 5.00475 7.28204 1.52248L7.71791 1.2775C9.76067 4.9119 9.76067 10.0881 7.71791 13.7225L7.28204 13.4775Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
    <path opacity=".15" d="M7.82098 13.5064C9.72502 9.99523 9.72636 5.01411 7.82492 1.50084L8.26465 1.26285C10.2465 4.92466 10.2451 10.085 8.26052 13.7448L7.82098 13.5064Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
    <path opacity=".2" d="M8.41284 13.429C10.1952 9.92842 10.1957 5.07537 8.41435 1.57402L8.85999 1.34729C10.7139 4.99113 10.7133 10.0128 8.85841 13.6559L8.41284 13.429Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
    <path opacity=".25" d="M9.02441 13.2956C10.6567 9.8379 10.6586 5.17715 9.03005 1.71656L9.48245 1.50366C11.1745 5.09919 11.1726 9.91629 9.47657 13.5091L9.02441 13.2956Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
    <path opacity=".3" d="M9.66809 13.0655C11.1097 9.69572 11.1107 5.3121 9.67088 1.94095L10.1307 1.74457C11.6241 5.24121 11.6231 9.76683 10.1278 13.2622L9.66809 13.0655Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
    <path opacity=".35" d="M10.331 12.7456C11.5551 9.52073 11.5564 5.49103 10.3347 2.26444L10.8024 2.0874C12.0672 5.42815 12.0659 9.58394 10.7985 12.9231L10.331 12.7456Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
    <path opacity=".4" d="M11.0155 12.2986C11.9938 9.29744 11.9948 5.71296 11.0184 2.71067L11.4939 2.55603C12.503 5.6589 12.502 9.35178 11.4909 12.4535L11.0155 12.2986Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
    <path opacity=".45" d="M11.7214 11.668C12.4254 9.01303 12.4262 5.99691 11.7237 3.34116L12.2071 3.21329C12.9318 5.95292 12.931 9.05728 12.2047 11.7961L11.7214 11.668Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
    <path opacity=".5" d="M12.4432 10.752C12.8524 8.63762 12.8523 6.36089 12.4429 4.2466L12.9338 4.15155C13.3553 6.32861 13.3554 8.66985 12.9341 10.847L12.4432 10.752Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
    <path d="M7.49991 0.877045C3.84222 0.877045 0.877075 3.84219 0.877075 7.49988C0.877075 9.1488 1.47969 10.657 2.4767 11.8162L1.64647 12.6464C1.45121 12.8417 1.45121 13.1583 1.64647 13.3535C1.84173 13.5488 2.15832 13.5488 2.35358 13.3535L3.18383 12.5233C4.34302 13.5202 5.8511 14.1227 7.49991 14.1227C11.1576 14.1227 14.1227 11.1575 14.1227 7.49988C14.1227 5.85107 13.5202 4.34298 12.5233 3.1838L13.3536 2.35355C13.5488 2.15829 13.5488 1.8417 13.3536 1.64644C13.1583 1.45118 12.8417 1.45118 12.6465 1.64644L11.8162 2.47667C10.657 1.47966 9.14883 0.877045 7.49991 0.877045ZM11.1423 3.15065C10.1568 2.32449 8.88644 1.82704 7.49991 1.82704C4.36689 1.82704 1.82708 4.36686 1.82708 7.49988C1.82708 8.88641 2.32452 10.1568 3.15069 11.1422L11.1423 3.15065ZM3.85781 11.8493C4.84322 12.6753 6.11348 13.1727 7.49991 13.1727C10.6329 13.1727 13.1727 10.6329 13.1727 7.49988C13.1727 6.11345 12.6754 4.84319 11.8493 3.85778L3.85781 11.8493Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
  </svg>
);

export const WidgetZone: React.FC<WidgetZoneProps> = ({ zone, className }) => {
  const { getWidgetsByZone, isZoneCollapsed, toggleZoneCollapsed } = useLayoutStore();
  const { openWidgetModal } = useUIStore();

  const widgets = getWidgetsByZone(zone);
  const isCollapsed = isZoneCollapsed(zone);
  
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
        flex flex-row items-center space-x-1
        p-1
      `}>
        {/* Collapse/Expand Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => toggleZoneCollapsed(zone)}
          className="w-8 h-8 p-1 flex items-center justify-center hover:bg-neutral-200"
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
            className="w-8 h-8 p-1 flex items-center justify-center hover:bg-sage-200 text-sage-700"
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
                  <div className="flex justify-center mb-3">
                    <EmptyStateIcon />
                  </div>
                  <p className="text-sm">Click the + button to add widgets.</p>
                </div>
              </div>
            ) : (
              <div className={`${
                zone === 'top' || zone === 'bottom'
                  ? 'flex flex-wrap gap-4' 
                  : 'space-y-4'
              }`}>
                {widgets.map(widget => (
                  <WidgetContainer
                    key={widget.id}
                    widget={widget}
                    className={zone === 'top' || zone === 'bottom' ? 'flex-1 min-w-80' : 'w-full'}
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