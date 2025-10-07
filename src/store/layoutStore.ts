import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ImperativePanelGroupHandle } from 'react-resizable-panels';
import { Widget, WidgetType, WidgetZone, LayoutConfig, AppSettings } from '../types';

interface LayoutState {
  widgets: Widget[];
  layoutConfig: LayoutConfig;
  settings: AppSettings;
  distractionFreeMode: boolean;
  
  // Widget management
  addWidget: (type: WidgetType, zone: WidgetZone) => void;
  removeWidget: (widgetId: string) => void;
  updateWidget: (widgetId: string, updates: Partial<Widget>) => void;
  moveWidget: (widgetId: string, newZone: WidgetZone, newPosition: number) => void;
  toggleWidgetCollapsed: (widgetId: string) => void;
  
  // Layout management
  updateLayoutConfig: (updates: Partial<LayoutConfig>) => void;
  toggleZoneCollapsed: (zone: WidgetZone) => void;
  resizeZone: (zone: WidgetZone, size: number) => void;
  
  // Utility functions
  getWidgetsByZone: (zone: WidgetZone) => Widget[];
  isZoneCollapsed: (zone: WidgetZone) => boolean;
  setZoneSize: (zone: WidgetZone, size: number) => void;
  
  // New method for PanelGroup-based collapsing
  toggleZoneCollapsedWithPanelGroup: (zone: WidgetZone, panelGroupRef: React.RefObject<ImperativePanelGroupHandle>, panelId: string) => void;
}

const defaultLayoutConfig: LayoutConfig = {
  topZoneHeight: 25, // percentage
  bottomZoneHeight: 25,
  leftZoneWidth: 25,
  rightZoneWidth: 25,
  isTopCollapsed: false,
  isBottomCollapsed: false,
  isLeftCollapsed: false,
  isRightCollapsed: false,
  topZonePreviousHeight: 25,
  bottomZonePreviousHeight: 25,
  leftZonePreviousWidth: 25,
  rightZonePreviousWidth: 25,
};

const defaultSettings: AppSettings = {
  theme: 'system',
  autoSaveInterval: 30,
  distractionFreeMode: false,
  exportFormat: 'pdf',
  apiKeys: {},
};

export const useLayoutStore = create<LayoutState>()(
  persist(
    (set, get) => ({
      widgets: [],
      layoutConfig: defaultLayoutConfig,
      settings: defaultSettings,
      distractionFreeMode: false,

      addWidget: (type: WidgetType, zone: WidgetZone) => {
        const newWidget: Widget = {
          id: `${type}-${Date.now()}`,
          type,
          zone,
          isEnabled: true,
          isCollapsed: false,
          position: get().getWidgetsByZone(zone).length,
          size: 50, // default 50% of zone
          data: {},
        };

        set(state => ({
          widgets: [...state.widgets, newWidget],
        }));
      },

      removeWidget: (widgetId: string) => {
        set(state => ({
          widgets: state.widgets.filter(w => w.id !== widgetId),
        }));
      },

      updateWidget: (widgetId: string, updates: Partial<Widget>) => {
        set(state => ({
          widgets: state.widgets.map(w => 
            w.id === widgetId ? { ...w, ...updates } : w
          ),
        }));
      },

      moveWidget: (widgetId: string, newZone: WidgetZone, newPosition: number) => {
        set(state => ({
          widgets: state.widgets.map(w => 
            w.id === widgetId 
              ? { ...w, zone: newZone, position: newPosition }
              : w
          ),
        }));
      },

      toggleWidgetCollapsed: (widgetId: string) => {
        set(state => ({
          widgets: state.widgets.map(w => 
            w.id === widgetId 
              ? { ...w, isCollapsed: !w.isCollapsed }
              : w
          ),
        }));
      },

      updateLayoutConfig: (updates: Partial<LayoutConfig>) => {
        set(state => ({
          layoutConfig: { ...state.layoutConfig, ...updates },
        }));
      },

      toggleZoneCollapsed: (zone: WidgetZone) => {
        set(state => {
          const collapseKey = `is${zone.charAt(0).toUpperCase() + zone.slice(1)}Collapsed` as keyof LayoutConfig;
          const isVertical = zone === 'top' || zone === 'bottom';
          const sizeKey = isVertical 
            ? `${zone}ZoneHeight` as keyof LayoutConfig
            : `${zone}ZoneWidth` as keyof LayoutConfig;
          const previousSizeKey = isVertical
            ? `${zone}ZonePreviousHeight` as keyof LayoutConfig
            : `${zone}ZonePreviousWidth` as keyof LayoutConfig;

          const isCurrentlyCollapsed = state.layoutConfig[collapseKey] as boolean;
          const currentSize = state.layoutConfig[sizeKey] as number;
          const previousSize = state.layoutConfig[previousSizeKey] as number | undefined;

          const newLayoutConfig = { ...state.layoutConfig };

          if (!isCurrentlyCollapsed) {
            // Collapsing: save current size and set to 1
            newLayoutConfig[previousSizeKey] = currentSize;
            newLayoutConfig[sizeKey] = 1;
          } else {
            // Expanding: restore from previous size
            const restoreSize = (previousSize && previousSize > 1) ? previousSize : 25;
            newLayoutConfig[sizeKey] = restoreSize;
          }

          // Toggle the collapsed state
          newLayoutConfig[collapseKey] = !isCurrentlyCollapsed;

          return {
            layoutConfig: newLayoutConfig,
          };
        });
      },

      toggleZoneCollapsedWithPanelGroup: (zone: WidgetZone, panelGroupRef: React.RefObject<ImperativePanelGroupHandle>, panelId: string) => {
        const panelGroup = panelGroupRef.current;
        if (!panelGroup) return;

        // Get current collapsed state
        const { isZoneCollapsed } = get();
        const isCurrentlyCollapsed = isZoneCollapsed(zone);

        if (!isCurrentlyCollapsed) {
          // Collapsing: save current size before collapsing
          const { layoutConfig } = get();
          const isVertical = zone === 'top' || zone === 'bottom';
          const sizeKey = isVertical 
            ? `${zone}ZoneHeight` as keyof LayoutConfig
            : `${zone}ZoneWidth` as keyof LayoutConfig;
          const previousSizeKey = isVertical
            ? `${zone}ZonePreviousHeight` as keyof LayoutConfig
            : `${zone}ZonePreviousWidth` as keyof LayoutConfig;
          
          const currentSize = layoutConfig[sizeKey] as number;
          
          // Save current size
          set(state => ({
            layoutConfig: {
              ...state.layoutConfig,
              [previousSizeKey]: currentSize,
            }
          }));
        }

        // Use PanelGroup's built-in collapse functionality
        panelGroup.setLayout([]);
        
        // Toggle the collapsed state in our store
        set(state => {
          const collapseKey = `is${zone.charAt(0).toUpperCase() + zone.slice(1)}Collapsed` as keyof LayoutConfig;
          const newLayoutConfig = { ...state.layoutConfig };
          newLayoutConfig[collapseKey] = !isCurrentlyCollapsed;
          
          if (isCurrentlyCollapsed) {
            // Expanding: restore previous size
            const isVertical = zone === 'top' || zone === 'bottom';
            const sizeKey = isVertical 
              ? `${zone}ZoneHeight` as keyof LayoutConfig
              : `${zone}ZoneWidth` as keyof LayoutConfig;
            const previousSizeKey = isVertical
              ? `${zone}ZonePreviousHeight` as keyof LayoutConfig
              : `${zone}ZonePreviousWidth` as keyof LayoutConfig;
            
            const previousSize = state.layoutConfig[previousSizeKey] as number | undefined;
            const restoreSize = (previousSize && previousSize > 1) ? previousSize : 25;
            newLayoutConfig[sizeKey] = restoreSize;
          }
          
          return {
            layoutConfig: newLayoutConfig,
          };
        });
      },

      resizeZone: (zone: WidgetZone, size: number) => {
        const sizeKey = zone === 'top' || zone === 'bottom' 
          ? `${zone}ZoneHeight` 
          : `${zone}ZoneWidth`;
        
        set(state => ({
          layoutConfig: {
            ...state.layoutConfig,
            [sizeKey]: Math.max(10, Math.min(80, size)), // Min 10%, Max 80%
          },
        }));
      },

      setZoneSize: (zone: WidgetZone, size: number) => {
        const sizeKey = zone === 'top' || zone === 'bottom' 
          ? `${zone}ZoneHeight` 
          : `${zone}ZoneWidth`;
        set(state => ({
          layoutConfig: {
            ...state.layoutConfig,
            [sizeKey]: size,
          },
        }));
      },

      updateSettings: (updates: Partial<AppSettings>) => {
        set(state => ({
          settings: { ...state.settings, ...updates },
        }));
      },

      toggleDistractionFreeMode: () => {
        set(state => ({
          distractionFreeMode: !state.distractionFreeMode,
          settings: {
            ...state.settings,
            distractionFreeMode: !state.distractionFreeMode,
          },
        }));
      },

      getWidgetsByZone: (zone: WidgetZone) => {
        return get().widgets
          .filter(w => w.zone === zone && w.isEnabled)
          .sort((a, b) => a.position - b.position);
      },

      isZoneCollapsed: (zone: WidgetZone) => {
        const { layoutConfig } = get();
        switch (zone) {
          case 'top': return layoutConfig.isTopCollapsed;
          case 'bottom': return layoutConfig.isBottomCollapsed;
          case 'left': return layoutConfig.isLeftCollapsed;
          case 'right': return layoutConfig.isRightCollapsed;
          default: return false;
        }
      },
    }),
    {
      name: 'layout-storage',
    }
  )
);