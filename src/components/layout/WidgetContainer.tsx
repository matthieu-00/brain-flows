import React, { Suspense, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { X, Minimize2, Maximize2 } from 'lucide-react';
import { Widget } from '../../types';
import { useLayoutStore } from '../../store/layoutStore';
import { widgetConfig, getWidgetComponent, getWidgetSizingSpec } from '../../constants/widgets';
import { Button } from '../ui/Button';
import { IconButton } from '../ui/IconButton';
import { InlineAlert } from '../ui/InlineAlert';
import { ErrorBoundary } from '../ErrorBoundary';

interface WidgetContainerProps {
  widget: Widget;
  className?: string;
}

const WidgetContainer: React.FC<WidgetContainerProps> = ({
  widget,
  className = '',
}) => {
  const removeWidget = useLayoutStore((state) => state.removeWidget);
  const toggleWidgetCollapsed = useLayoutStore((state) => state.toggleWidgetCollapsed);
  const sizingSpec = useMemo(() => getWidgetSizingSpec(widget.type), [widget.type]);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const config = useMemo(() => widgetConfig.find(w => w.type === widget.type), [widget.type]);
  const WidgetComponent = useMemo(() => getWidgetComponent(widget.type), [widget.type]);

  const isHorizontalZone = widget.zone === 'top' || widget.zone === 'bottom';
  const containerStyle = useMemo(() => {
    if (widget.isCollapsed) return { minHeight: '60px', height: '60px' };
    const style: React.CSSProperties = {
      minHeight: `${sizingSpec.minHeight ?? 200}px`,
      height: 'auto',
    };
    if (isHorizontalZone && sizingSpec.minWidth) {
      style.minWidth = `${sizingSpec.minWidth}px`;
    }
    if (sizingSpec.maxHeight) {
      style.maxHeight = `${sizingSpec.maxHeight}px`;
    }
    return style;
  }, [widget.isCollapsed, sizingSpec, isHorizontalZone]);

  const widgetDisplayName = config?.name || 'Widget';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`bg-white dark:bg-neutral-surface rounded-lg border border-neutral-300 dark:border-neutral-700 shadow-sm overflow-hidden mb-4 ${className}`}
      style={containerStyle}
    >
      {/* Widget Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-cream-50 dark:bg-neutral-700 border-b border-neutral-300 dark:border-neutral-700">
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-text">
          {widgetDisplayName}
        </h3>
        
        <div className="flex items-center space-x-1">
          <IconButton
            label={widget.isCollapsed ? `Expand ${widgetDisplayName}` : `Collapse ${widgetDisplayName}`}
            onClick={() => toggleWidgetCollapsed(widget.id)}
          >
            {widget.isCollapsed ? (
              <Maximize2 className="w-3 h-3" />
            ) : (
              <Minimize2 className="w-3 h-3" />
            )}
          </IconButton>

          <IconButton
            variant="danger"
            label={`Remove ${widgetDisplayName}`}
            onClick={() => setShowRemoveConfirm(true)}
          >
            <X className="w-3 h-3" />
          </IconButton>
        </div>
      </div>

      {/* Remove confirmation */}
      {showRemoveConfirm && (
        <div className="px-4 py-2 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800 flex items-center justify-between gap-2">
          <span className="text-xs text-red-700 dark:text-red-400">Remove {widgetDisplayName}?</span>
          <div className="flex items-center gap-1">
            <Button
              variant="danger"
              size="sm"
              onClick={() => removeWidget(widget.id)}
              className="text-xs px-2 py-1"
            >
              Remove
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowRemoveConfirm(false)}
              className="text-xs px-2 py-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Widget Content */}
      {!widget.isCollapsed && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className={`p-4 ${sizingSpec.overflowBehavior === 'scroll' ? 'overflow-y-auto' : 'overflow-hidden'}`}
        >
          <Suspense fallback={
            <div className="flex items-center justify-center py-12" role="status" aria-label="Loading widget">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-sage-200 dark:border-sage-700 border-t-sage-700 dark:border-t-sage-400"></div>
              <span className="ml-3 text-sm text-neutral-600 dark:text-neutral-400">Loading widget...</span>
            </div>
          }>
            <ErrorBoundary
              fallback={
                <InlineAlert
                  variant="error"
                  action={
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeWidget(widget.id)}
                      className="shrink-0 border-red-300 dark:border-red-700 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30"
                    >
                      Remove
                    </Button>
                  }
                >
                  <p className="font-semibold">Widget failed to render</p>
                  <p className="mt-1">Try removing and adding this widget again.</p>
                </InlineAlert>
              }
            >
              {WidgetComponent ? <WidgetComponent widget={widget} /> : (
                <div className="text-center py-8 text-neutral-500 dark:text-neutral-400">
                  <div className="text-4xl mb-2">?</div>
                  <p className="text-sm">Unknown widget type</p>
                </div>
              )}
            </ErrorBoundary>
          </Suspense>
        </motion.div>
      )}
    </motion.div>
  );
};

export const WidgetContainerMemo = React.memo(WidgetContainer);
export { WidgetContainerMemo as WidgetContainer };