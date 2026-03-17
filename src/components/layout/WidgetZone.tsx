import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { ImperativePanelGroupHandle } from 'react-resizable-panels';
import { useShallow } from 'zustand/react/shallow';
import { useLayoutStore } from '../../store/layoutStore';
import { useUIStore } from '../../store/uiStore';
import { WidgetZone as WidgetZoneType } from '../../types';
import { Button } from '../ui/Button';
import { EmptyState } from '../ui/EmptyState';
import { WidgetContainer } from './WidgetContainer';

interface WidgetZoneProps {
  zone: WidgetZoneType;
  className?: string;
  panelGroupRef: React.RefObject<ImperativePanelGroupHandle>;
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

export const WidgetZone: React.FC<WidgetZoneProps> = ({ zone, className, panelGroupRef }) => {
  // Use useShallow so the selector result is compared by value, not reference.
  // Without it, filter/sort returns a new array each time, causing infinite re-renders.
  const widgets = useLayoutStore(
    useShallow((state) =>
      state.widgets
        .filter((w) => w.zone === zone && w.isEnabled)
        .sort((a, b) => a.position - b.position)
    )
  );
  const isCollapsed = useLayoutStore((state) => {
    const { layoutConfig } = state;
    switch (zone) {
      case 'top': return layoutConfig.isTopCollapsed;
      case 'bottom': return layoutConfig.isBottomCollapsed;
      case 'left': return layoutConfig.isLeftCollapsed;
      case 'right': return layoutConfig.isRightCollapsed;
      default: return false;
    }
  });
  const toggleZoneCollapsedWithPanelGroup = useLayoutStore((state) => state.toggleZoneCollapsedWithPanelGroup);
  const openWidgetModal = useUIStore((state) => state.openWidgetModal);
  
  const getCollapseIcon = (iconClass: string) => {
    if (isCollapsed) {
      switch (zone) {
        case 'top': return <ChevronDown className={iconClass} />;
        case 'bottom': return <ChevronUp className={iconClass} />;
        case 'left': return <ChevronRight className={iconClass} />;
        case 'right': return <ChevronLeft className={iconClass} />;
        default: return <ChevronRight className={iconClass} />;
      }
    } else {
      switch (zone) {
        case 'top': return <ChevronUp className={iconClass} />;
        case 'bottom': return <ChevronDown className={iconClass} />;
        case 'left': return <ChevronLeft className={iconClass} />;
        case 'right': return <ChevronRight className={iconClass} />;
        default: return <ChevronUp className={iconClass} />;
      }
    }
  };

  // Chevron on panel border (edge adjacent to resize handle).
  // When expanded: pin to the edge (bottom of top panel, top of bottom) so it's out of the way and shows on hover.
  // When collapsed: center in the thin strip so the 28px button isn't cut off.
  const getControlPosition = () => {
    switch (zone) {
      case 'left':
        return 'right-0 top-1/2 -translate-y-1/2';
      case 'right':
        return 'left-0 top-1/2 -translate-y-1/2';
      case 'top':
        return isCollapsed
          ? 'top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2'
          : 'bottom-0 left-1/2 -translate-x-1/2';
      case 'bottom':
        return isCollapsed
          ? 'top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2'
          : 'top-0 left-1/2 -translate-x-1/2';
      default:
        return 'right-0 top-1/2 -translate-y-1/2';
    }
  };

  const getHeaderVisibility = () => {
    if (isCollapsed) {
      return 'opacity-100';
    } else {
      return 'opacity-0 group-hover:opacity-100';
    }
  };

  // Keep one compact size in all states.
  const chevronSizeClass = '!w-7 !h-7 !min-w-7 !min-h-7';
  const chevronIconClass = 'w-3.5 h-3.5';
  const chevronButtonVisualClass = isCollapsed
    ? 'border border-sage-200 dark:border-neutral-700 shadow-sm !bg-sage-100 dark:!bg-neutral-800 hover:!bg-sage-200 dark:hover:!bg-neutral-800'
    : '!bg-transparent hover:!bg-sage-100 dark:hover:!bg-neutral-800';

  return (
    <div className={`h-full bg-cream-100 dark:bg-neutral-surface border-neutral-300 dark:border-neutral-700 relative group overflow-visible ${className}`}>
      {/* Chevron on panel border - collapse/expand */}
      <div
        className={`
          absolute z-50 w-fit
          p-0
          ${getControlPosition()}
          ${getHeaderVisibility()}
          transition-opacity duration-200 ease-in-out
        `}
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={() => toggleZoneCollapsedWithPanelGroup(zone, panelGroupRef)}
          className={`${chevronSizeClass} ${chevronButtonVisualClass} !p-0 flex items-center justify-center text-sage-900 focus:!ring-0 focus:!ring-offset-0`}
          title={isCollapsed ? `Expand ${zone} zone` : `Collapse ${zone} zone`}
          aria-label={isCollapsed ? `Expand ${zone} zone` : `Collapse ${zone} zone`}
        >
          {getCollapseIcon(chevronIconClass)}
        </Button>
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
                <button
                  onClick={() => openWidgetModal('add', zone)}
                  className="group transition-colors cursor-pointer"
                  aria-label={`Add widgets to ${zone} zone`}
                >
                  <EmptyState
                    icon={<EmptyStateIcon />}
                    title="No widgets yet"
                    description="Click to add widgets to this zone"
                    className="group-hover:text-sage-700 dark:group-hover:text-sage-400"
                  />
                </button>
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
                    className={zone === 'top' || zone === 'bottom' ? 'flex-1' : 'w-full'}
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