import { create } from 'zustand';
import { persist } from 'zustand/middleware';
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
  
  // Settings management
  updateSettings: (updates: Partial<AppSettings>) => void;
  toggleDistractionFreeMode: () => void;
  
  // Utility functions
  getWidgetsByZone: (zone: WidgetZone) => Widget[];
  isZoneCollapsed: (zone: WidgetZone) => boolean;
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
        const collapseKey = `is${zone.charAt(0).toUpperCase() + zone.slice(1)}Collapsed` as keyof LayoutConfig;
        set(state => ({
          layoutConfig: {
            ...state.layoutConfig,
            [collapseKey]: !state.layoutConfig[collapseKey],
          },
        }));
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