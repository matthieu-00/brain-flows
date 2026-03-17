import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';
import { ImperativePanelGroupHandle } from 'react-resizable-panels';
import { Widget, WidgetType, WidgetZone, type LayoutConfig, AppSettings } from '../types';
import { dateReplacer, dateReviver } from '../utils/persistDates';
import { isSupabaseConfigured, requireSupabase } from '../lib/supabaseClient';
import { useAuthStore } from './authStore';

/**
 * Wraps localStorage with a debounced setItem to avoid thrashing storage
 * on rapid state updates (widget drag, timer ticks, panel resize).
 */
function createDebouncedStorage(ms = 500): StateStorage {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let pendingKey: string | null = null;
  let pendingValue: string | null = null;

  return {
    getItem: (name) => localStorage.getItem(name),
    setItem: (name, value) => {
      pendingKey = name;
      pendingValue = value;
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        if (pendingKey && pendingValue !== null) {
          localStorage.setItem(pendingKey, pendingValue);
        }
        timer = null;
        pendingKey = null;
        pendingValue = null;
      }, ms);
    },
    removeItem: (name) => localStorage.removeItem(name),
  };
}

interface LayoutState {
  widgets: Widget[];
  layoutConfig: LayoutConfig;
  settings: AppSettings;
  distractionFreeMode: boolean;
  isSyncingSettings: boolean;
  
  // Widget management
  addWidget: (type: WidgetType, zone: WidgetZone) => boolean;
  removeWidget: (widgetId: string) => void;
  updateWidget: (widgetId: string, updates: Partial<Widget>) => void;
  moveWidget: (widgetId: string, newZone: WidgetZone, newPosition: number) => void;
  toggleWidgetCollapsed: (widgetId: string) => void;
  
  // Layout management
  updateLayoutConfig: (updates: Partial<LayoutConfig>) => void;
  handlePanelResize: (zone: WidgetZone, size: number) => void;
  resetLayout: () => void;
  
  // Utility functions
  getWidgetsByZone: (zone: WidgetZone) => Widget[];
  isZoneCollapsed: (zone: WidgetZone) => boolean;
  
  // Settings management
  updateSettings: (updates: Partial<AppSettings>) => void;
  toggleDistractionFreeMode: () => void;
  loadSettingsForUser: (userId: string) => Promise<void>;
  saveSettingsForUser: () => Promise<void>;
  
  // New method for PanelGroup-based collapsing
  toggleZoneCollapsedWithPanelGroup: (zone: WidgetZone, panelGroupRef: React.RefObject<ImperativePanelGroupHandle>) => void;
}

interface UserSettingsRow {
  user_id: string;
  widgets: Widget[] | null;
  layout: LayoutConfig | null;
  preferences: AppSettings | null;
  distraction_free_mode: boolean | null;
}

let settingsSaveTimer: ReturnType<typeof setTimeout> | null = null;
let applyingRemoteSettings = false;
const SETTINGS_SYNC_DEBOUNCE_MS = 900;

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
  defaultFileType: 'md',
  editorFontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
  editorFontSize: 18,
  editorTextColor: '#2c2c2c',
  apiKeys: {},
  profile: {},
  keyboardShortcuts: {},
};

function queueSettingsSave() {
  if (applyingRemoteSettings) return;
  const userId = useAuthStore.getState().user?.id;
  if (!userId || !isSupabaseConfigured) return;

  if (settingsSaveTimer) clearTimeout(settingsSaveTimer);
  settingsSaveTimer = setTimeout(() => {
    void useLayoutStore.getState().saveSettingsForUser();
    settingsSaveTimer = null;
  }, SETTINGS_SYNC_DEBOUNCE_MS);
}

export const useLayoutStore = create<LayoutState>()(
  persist(
    (set, get) => ({
      widgets: [
        { id: 'default-timer', type: 'timer', zone: 'right', isEnabled: true, isCollapsed: false, position: 0, size: 50, data: {} },
        { id: 'default-ai-chat', type: 'ai-chat', zone: 'left', isEnabled: true, isCollapsed: false, position: 0, size: 50, data: {} },
      ],
      layoutConfig: defaultLayoutConfig,
      settings: defaultSettings,
      distractionFreeMode: false,
      isSyncingSettings: false,

      addWidget: (type: WidgetType, zone: WidgetZone) => {
        const existingInZone = get().getWidgetsByZone(zone);
        if (existingInZone.length > 0) return false;

        const newWidget: Widget = {
          id: `${type}-${Date.now()}`,
          type,
          zone,
          isEnabled: true,
          isCollapsed: false,
          position: 0,
          size: 50,
          data: {},
        };

        set(state => ({
          widgets: [...state.widgets, newWidget],
        }));
        queueSettingsSave();
        return true;
      },

      removeWidget: (widgetId: string) => {
        set(state => ({
          widgets: state.widgets.filter(w => w.id !== widgetId),
        }));
        queueSettingsSave();
      },

      updateWidget: (widgetId: string, updates: Partial<Widget>) => {
        set(state => ({
          widgets: state.widgets.map(w =>
            w.id === widgetId ? { ...w, ...updates } : w
          ),
        }));
        queueSettingsSave();
      },

      moveWidget: (widgetId: string, newZone: WidgetZone, newPosition: number) => {
        set(state => ({
          widgets: state.widgets.map(w => 
            w.id === widgetId 
              ? { ...w, zone: newZone, position: newPosition }
              : w
          ),
        }));
        queueSettingsSave();
      },

      toggleWidgetCollapsed: (widgetId: string) => {
        set(state => ({
          widgets: state.widgets.map(w => 
            w.id === widgetId 
              ? { ...w, isCollapsed: !w.isCollapsed }
              : w
          ),
        }));
        queueSettingsSave();
      },

      updateLayoutConfig: (updates: Partial<LayoutConfig>) => {
        set(state => ({
          layoutConfig: { ...state.layoutConfig, ...updates },
        }));
        queueSettingsSave();
      },

      handlePanelResize: (zone: WidgetZone, size: number) => {
        const collapseThreshold = 5;
        set(state => {
          const isVertical = zone === 'top' || zone === 'bottom';
          const sizeKey = isVertical
            ? `${zone}ZoneHeight` as keyof LayoutConfig
            : `${zone}ZoneWidth` as keyof LayoutConfig;
          const collapseKey = `is${zone.charAt(0).toUpperCase() + zone.slice(1)}Collapsed` as keyof LayoutConfig;
          const previousSizeKey = isVertical
            ? `${zone}ZonePreviousHeight` as keyof LayoutConfig
            : `${zone}ZonePreviousWidth` as keyof LayoutConfig;

          const isCollapsed = size <= collapseThreshold;
          const newLayoutConfig = {
            ...state.layoutConfig,
            [sizeKey]: size,
            [collapseKey]: isCollapsed,
          };

          // Persist the latest user-resized expanded size for future restore.
          if (!isCollapsed) {
            newLayoutConfig[previousSizeKey] = size;
          }

          return { layoutConfig: newLayoutConfig };
        });
        queueSettingsSave();
      },

      resetLayout: () => {
        set({
          widgets: [],
          layoutConfig: { ...defaultLayoutConfig },
        });
        queueSettingsSave();
      },

      toggleZoneCollapsedWithPanelGroup: (zone: WidgetZone, panelGroupRef: React.RefObject<ImperativePanelGroupHandle>) => {
        const panelGroup = panelGroupRef.current;
        if (!panelGroup) return;
        const collapsedPct = 4;
        const minExpandedSize = zone === 'left' || zone === 'right' ? 20 : 14;

        // Get current layout and collapsed state
        const currentLayout = panelGroup.getLayout();
        const { isZoneCollapsed, layoutConfig } = get();
        const isCurrentlyCollapsed = isZoneCollapsed(zone);

        const isVertical = zone === 'top' || zone === 'bottom';
        const sizeKey = isVertical
          ? `${zone}ZoneHeight` as keyof LayoutConfig
          : `${zone}ZoneWidth` as keyof LayoutConfig;
        const previousSizeKey = isVertical
          ? `${zone}ZonePreviousHeight` as keyof LayoutConfig
          : `${zone}ZonePreviousWidth` as keyof LayoutConfig;

        let newLayout: number[];
        const newLayoutConfig = { ...layoutConfig };

        if (!isCurrentlyCollapsed) {
          // Collapsing: save current size and collapse to a compact visible strip
          // Use 3% for all panels - minimal space while keeping controls clickable
          const currentSize = layoutConfig[sizeKey] as number;
          newLayoutConfig[previousSizeKey] = currentSize;
          newLayoutConfig[sizeKey] = collapsedPct;

          // Calculate new layout based on zone
          if (zone === 'top') {
            // Vertical group: [top, main, bottom]
            const mainSize = currentLayout[1] || 50;
            const bottomSize = currentLayout[2] || layoutConfig.bottomZoneHeight;
            const spaceToRedistribute = currentSize - collapsedPct;
            newLayout = [collapsedPct, mainSize + spaceToRedistribute, bottomSize];
          } else if (zone === 'bottom') {
            // Vertical group: [top, main, bottom]
            const topSize = currentLayout[0] || layoutConfig.topZoneHeight;
            const mainSize = currentLayout[1] || 50;
            const spaceToRedistribute = currentSize - collapsedPct;
            newLayout = [topSize, mainSize + spaceToRedistribute, collapsedPct];
          } else if (zone === 'left') {
            // Horizontal group: [left, center, right]
            const centerSize = currentLayout[1] || 50;
            const rightSize = currentLayout[2] || layoutConfig.rightZoneWidth;
            const spaceToRedistribute = currentSize - collapsedPct;
            newLayout = [collapsedPct, centerSize + spaceToRedistribute, rightSize];
          } else {
            // right
            // Horizontal group: [left, center, right]
            const leftSize = currentLayout[0] || layoutConfig.leftZoneWidth;
            const centerSize = currentLayout[1] || 50;
            const spaceToRedistribute = currentSize - collapsedPct;
            newLayout = [leftSize, centerSize + spaceToRedistribute, collapsedPct];
          }
        } else {
          // Expanding: restore previous size
          const previousSize = layoutConfig[previousSizeKey] as number | undefined;
          const restoreSize = Math.max(minExpandedSize, (previousSize && previousSize > collapsedPct) ? previousSize : 25);
          newLayoutConfig[sizeKey] = restoreSize;

          // Calculate new layout based on zone
          if (zone === 'top') {
            // Vertical group: [top, main, bottom]
            const mainSize = currentLayout[1] || 50;
            const bottomSize = currentLayout[2] || layoutConfig.bottomZoneHeight;
            const spaceToTake = restoreSize - collapsedPct;
            newLayout = [restoreSize, Math.max(20, mainSize - spaceToTake), bottomSize];
          } else if (zone === 'bottom') {
            // Vertical group: [top, main, bottom]
            const topSize = currentLayout[0] || layoutConfig.topZoneHeight;
            const mainSize = currentLayout[1] || 50;
            const spaceToTake = restoreSize - collapsedPct;
            newLayout = [topSize, Math.max(20, mainSize - spaceToTake), restoreSize];
          } else if (zone === 'left') {
            // Horizontal group: [left, center, right]
            const centerSize = currentLayout[1] || 50;
            const rightSize = currentLayout[2] || layoutConfig.rightZoneWidth;
            const spaceToTake = restoreSize - collapsedPct;
            newLayout = [restoreSize, Math.max(25, centerSize - spaceToTake), rightSize];
          } else {
            // right
            // Horizontal group: [left, center, right]
            const leftSize = currentLayout[0] || layoutConfig.leftZoneWidth;
            const centerSize = currentLayout[1] || 50;
            const spaceToTake = restoreSize - collapsedPct;
            newLayout = [leftSize, Math.max(25, centerSize - spaceToTake), restoreSize];
          }
        }

        // Apply the new layout
        panelGroup.setLayout(newLayout);

        // Toggle the collapsed state in our store
        const collapseKey = `is${zone.charAt(0).toUpperCase() + zone.slice(1)}Collapsed` as keyof LayoutConfig;
        newLayoutConfig[collapseKey] = !isCurrentlyCollapsed;

        set({
          layoutConfig: newLayoutConfig,
        });
        queueSettingsSave();
      },

      updateSettings: (updates: Partial<AppSettings>) => {
        set(state => ({
          settings: { ...state.settings, ...updates },
        }));
        queueSettingsSave();
      },

      toggleDistractionFreeMode: () => {
        set(state => ({
          distractionFreeMode: !state.distractionFreeMode,
          settings: {
            ...state.settings,
            distractionFreeMode: !state.distractionFreeMode,
          },
        }));
        queueSettingsSave();
      },

      loadSettingsForUser: async (userId: string) => {
        if (!isSupabaseConfigured) return;
        const supabase = requireSupabase();
        set({ isSyncingSettings: true });

        try {
          const { data, error } = await supabase
            .from('user_settings')
            .select('user_id, widgets, layout, preferences, distraction_free_mode')
            .eq('user_id', userId)
            .maybeSingle();
          if (error) throw error;

          const row = data as UserSettingsRow | null;
          if (!row) {
            const importedKey = `layout-imported-${userId}`;
            const alreadyImported = localStorage.getItem(importedKey) === 'true';
            if (!alreadyImported) {
              await get().saveSettingsForUser();
              localStorage.setItem(importedKey, 'true');
            }
            set({ isSyncingSettings: false });
            return;
          }

          applyingRemoteSettings = true;
          set((state) => ({
            widgets: Array.isArray(row.widgets) ? row.widgets : state.widgets,
            layoutConfig: row.layout ?? state.layoutConfig,
            settings: row.preferences ?? state.settings,
            distractionFreeMode: row.distraction_free_mode ?? state.distractionFreeMode,
            isSyncingSettings: false,
          }));
          applyingRemoteSettings = false;
        } catch {
          applyingRemoteSettings = false;
          set({ isSyncingSettings: false });
        }
      },

      saveSettingsForUser: async () => {
        const userId = useAuthStore.getState().user?.id;
        if (!userId || !isSupabaseConfigured) return;

        const supabase = requireSupabase();
        const { widgets, layoutConfig, settings, distractionFreeMode } = get();

        set({ isSyncingSettings: true });
        try {
          const payload = {
            user_id: userId,
            widgets,
            layout: layoutConfig,
            preferences: settings,
            distraction_free_mode: distractionFreeMode,
            updated_at: new Date().toISOString(),
          };
          const { error } = await supabase.from('user_settings').upsert(payload);
          if (error) throw error;
          set({ isSyncingSettings: false });
        } catch {
          set({ isSyncingSettings: false });
        }
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
      storage: createJSONStorage(() => createDebouncedStorage(500), {
        replacer: dateReplacer,
        reviver: dateReviver,
      }),
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<LayoutState> | undefined;
        const merged = persisted ? { ...currentState, ...persisted } : currentState;
        if (merged.settings) {
          const s = merged.settings as Record<string, unknown>;
          if (!('defaultFileType' in s)) s.defaultFileType = 'md';
          if (!('profile' in s)) s.profile = {};
          if (!('keyboardShortcuts' in s)) s.keyboardShortcuts = {};
        }
        // Enforce one widget per zone: keep first widget per zone by position
        if (merged.widgets && Array.isArray(merged.widgets)) {
          const byZone = new Map<WidgetZone, Widget[]>();
          for (const w of merged.widgets as Widget[]) {
            if (!w.zone || !w.isEnabled) continue;
            const list = byZone.get(w.zone) ?? [];
            list.push(w);
            byZone.set(w.zone, list);
          }
          const onePerZone: Widget[] = [];
          for (const zone of ['top', 'bottom', 'left', 'right'] as const) {
            const list = byZone.get(zone) ?? [];
            if (list.length > 0) {
              const sorted = [...list].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
              onePerZone.push({ ...sorted[0], position: 0 });
            }
          }
          merged.widgets = onePerZone;
        }
        return merged;
      },
    }
  )
);