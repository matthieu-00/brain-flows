import { create } from 'zustand';
import { WidgetZone } from '../types';

interface UIState {
  // Widget Management Modal
  isWidgetModalOpen: boolean;
  widgetModalMode: 'add' | 'remove';
  selectedZone: WidgetZone | null;
  pendingChanges: boolean;
  
  // Modal actions
  openWidgetModal: (mode: 'add' | 'remove', zone?: WidgetZone) => void;
  closeWidgetModal: () => void;
  setSelectedZone: (zone: WidgetZone | null) => void;
  setPendingChanges: (pending: boolean) => void;
  
  // Confirmation dialog
  showConfirmDialog: boolean;
  confirmDialogMessage: string;
  confirmDialogAction: (() => void) | null;
  openConfirmDialog: (message: string, action: () => void) => void;
  closeConfirmDialog: () => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  // Initial state
  isWidgetModalOpen: false,
  widgetModalMode: 'add',
  selectedZone: null,
  pendingChanges: false,
  showConfirmDialog: false,
  confirmDialogMessage: '',
  confirmDialogAction: null,

  // Modal actions
  openWidgetModal: (mode: 'add' | 'remove', zone?: WidgetZone) => {
    set({
      isWidgetModalOpen: true,
      widgetModalMode: mode,
      selectedZone: zone || null,
      pendingChanges: false,
    });
  },

  closeWidgetModal: () => {
    const { pendingChanges } = get();
    
    if (pendingChanges) {
      get().openConfirmDialog(
        'You have unsaved changes. Are you sure you want to close?',
        () => {
          set({
            isWidgetModalOpen: false,
            selectedZone: null,
            pendingChanges: false,
          });
        }
      );
    } else {
      set({
        isWidgetModalOpen: false,
        selectedZone: null,
        pendingChanges: false,
      });
    }
  },

  setSelectedZone: (zone: WidgetZone | null) => {
    set({ selectedZone: zone });
  },

  setPendingChanges: (pending: boolean) => {
    set({ pendingChanges: pending });
  },

  // Confirmation dialog
  openConfirmDialog: (message: string, action: () => void) => {
    set({
      showConfirmDialog: true,
      confirmDialogMessage: message,
      confirmDialogAction: action,
    });
  },

  closeConfirmDialog: () => {
    set({
      showConfirmDialog: false,
      confirmDialogMessage: '',
      confirmDialogAction: null,
    });
  },
}));