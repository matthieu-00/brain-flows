import React, { Suspense, useEffect } from 'react';
import { useUIStore } from '../../store/uiStore';
import { useLayoutStore } from '../../store/layoutStore';
import { widgetConfig, getWidgetComponent } from '../../constants/widgets';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { InlineAlert } from '../ui/InlineAlert';
import { ErrorBoundary } from '../ErrorBoundary';

export const FocusedWidgetModal: React.FC = () => {
  const focusedWidgetId = useUIStore((state) => state.focusedWidgetId);
  const closeFocusedWidget = useUIStore((state) => state.closeFocusedWidget);
  const widgets = useLayoutStore((state) => state.widgets);
  const removeWidget = useLayoutStore((state) => state.removeWidget);

  const widget = focusedWidgetId
    ? widgets.find((w) => w.id === focusedWidgetId && w.isEnabled)
    : null;
  const config = widget ? widgetConfig.find((c) => c.type === widget.type) : null;
  const WidgetComponent = widget ? getWidgetComponent(widget.type) : null;
  const displayName = config?.name ?? 'Widget';

  const isOpen = Boolean(focusedWidgetId && widget);

  // Close modal if the focused widget was removed or disabled (e.g. from another tab or widget management).
  useEffect(() => {
    if (focusedWidgetId && !widget) {
      closeFocusedWidget();
    }
  }, [focusedWidgetId, widget, closeFocusedWidget]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={closeFocusedWidget}
      title={`${displayName} — Focus view`}
      size="focus"
    >
      <div className="flex-1 min-h-0 flex flex-col" role="region" aria-label={`${displayName} content`}>
        {widget && WidgetComponent ? (
          <div
            className={`flex-1 min-h-0 min-w-0 ${config?.sizing?.overflowBehavior === 'scroll' ? 'overflow-y-auto' : 'overflow-hidden'}`}
          >
            <Suspense
              fallback={
                <div className="flex items-center justify-center py-12" role="status" aria-label="Loading widget">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-sage-200 dark:border-sage-700 border-t-sage-700 dark:border-t-sage-400" />
                  <span className="ml-3 text-sm text-neutral-600 dark:text-neutral-400">Loading…</span>
                </div>
              }
            >
              <ErrorBoundary
                fallback={
                  <InlineAlert
                    variant="error"
                    action={
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          removeWidget(widget.id);
                          closeFocusedWidget();
                        }}
                        className="shrink-0 border-red-300 dark:border-red-700 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30"
                      >
                        Remove widget
                      </Button>
                    }
                  >
                    <p className="font-semibold">Widget failed to render</p>
                    <p className="mt-1">Try removing and adding this widget again, or close this view.</p>
                  </InlineAlert>
                }
              >
                <WidgetComponent widget={widget} />
              </ErrorBoundary>
            </Suspense>
          </div>
        ) : null}
      </div>
    </Modal>
  );
};
