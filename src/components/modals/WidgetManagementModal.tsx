import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, StopCircle, Check, X } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useUIStore } from '../../store/uiStore';
import { useLayoutStore } from '../../store/layoutStore';
import { WidgetType, WidgetZone } from '../../types';

const availableWidgets: { 
  type: WidgetType; 
  name: string; 
  icon: string; 
  description: string;
  color: string;
}[] = [
  { type: 'sticky-notes', name: 'Sticky Notes', icon: '📝', description: 'Quick notes and reminders', color: 'bg-yellow-100 border-yellow-300' },
  { type: 'flashcards', name: 'Flashcards', icon: '🃏', description: 'Study cards with flip animation', color: 'bg-blue-100 border-blue-300' },
  { type: 'chess', name: 'Chess Game', icon: '♟️', description: 'Play chess with move history', color: 'bg-gray-100 border-gray-300' },
  { type: 'sudoku', name: 'Sudoku', icon: '🧩', description: 'Brain training puzzles', color: 'bg-purple-100 border-purple-300' },
  { type: 'fidget-tools', name: 'Fidget Tools', icon: '🎯', description: 'Stress relief tools', color: 'bg-green-100 border-green-300' },
  { type: 'drawing-canvas', name: 'Drawing', icon: '🎨', description: 'Sketch and draw', color: 'bg-pink-100 border-pink-300' },
  { type: 'ai-chat', name: 'AI Chat', icon: '🤖', description: 'Chat with AI assistant', color: 'bg-indigo-100 border-indigo-300' },
  { type: 'timer', name: 'Timer', icon: '⏱️', description: 'Focus timer sessions', color: 'bg-orange-100 border-orange-300' },
  { type: 'calculator', name: 'Calculator', icon: '🧮', description: 'Scientific calculator', color: 'bg-teal-100 border-teal-300' },
  { type: 'weather', name: 'Weather', icon: '🌤️', description: 'Local weather info', color: 'bg-cyan-100 border-cyan-300' },
];

const zones: { value: WidgetZone; label: string }[] = [
  { value: 'top', label: 'Top' },
  { value: 'left', label: 'Left' },
  { value: 'right', label: 'Right' },
  { value: 'bottom', label: 'Bottom' },
];

export const WidgetManagementModal: React.FC = () => {
  const {
    isWidgetModalOpen,
    widgetModalMode,
    selectedZone,
    pendingChanges,
    closeWidgetModal,
    setSelectedZone,
    setPendingChanges,
  } = useUIStore();

  const { widgets, addWidget, removeWidget, getWidgetsByZone } = useLayoutStore();

  const [selectedWidgets, setSelectedWidgets] = useState<WidgetType[]>([]);
  const [widgetsToRemove, setWidgetsToRemove] = useState<string[]>([]);
  const [targetZone, setTargetZone] = useState<WidgetZone>(selectedZone || 'right');

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isWidgetModalOpen) {
      setSelectedWidgets([]);
      setWidgetsToRemove([]);
      setTargetZone(selectedZone || 'right');
      setPendingChanges(false);
    }
  }, [isWidgetModalOpen, selectedZone, setPendingChanges]);

  // Update target zone when selectedZone changes
  useEffect(() => {
    if (selectedZone) {
      setTargetZone(selectedZone);
    }
  }, [selectedZone]);

  const handleWidgetSelect = (type: WidgetType) => {
    if (widgetModalMode === 'add') {
      const newSelection = selectedWidgets.includes(type)
        ? selectedWidgets.filter(w => w !== type)
        : [...selectedWidgets, type];
      
      setSelectedWidgets(newSelection);
      setPendingChanges(newSelection.length > 0);
    }
  };

  const handleWidgetRemove = (widgetId: string) => {
    if (widgetModalMode === 'remove') {
      const newRemoval = widgetsToRemove.includes(widgetId)
        ? widgetsToRemove.filter(id => id !== widgetId)
        : [...widgetsToRemove, widgetId];
      
      setWidgetsToRemove(newRemoval);
      setPendingChanges(newRemoval.length > 0);
    }
  };

  const handleSave = () => {
    if (widgetModalMode === 'add') {
      selectedWidgets.forEach(type => {
        addWidget(type, targetZone);
      });
    } else {
      widgetsToRemove.forEach(widgetId => {
        removeWidget(widgetId);
      });
    }
    
    setPendingChanges(false);
    closeWidgetModal();
  };

  const isZoneAvailable = (zone: WidgetZone) => {
    const zoneWidgets = getWidgetsByZone(zone);
    return zoneWidgets.length < 3; // Max 3 widgets per zone
  };

  const getExistingWidgetTypes = () => {
    return new Set(widgets.map(w => w.type));
  };

  const isWidgetAlreadyExists = (type: WidgetType) => {
    return getExistingWidgetTypes().has(type);
  };

  return (
    <>
      <Modal
        isOpen={isWidgetModalOpen}
        onClose={closeWidgetModal}
        title={widgetModalMode === 'add' ? 'Add Widgets' : 'Remove Widgets'}
        size="lg"
      >
        <div className="space-y-6">
          {/* Mode Indicator */}
          <div className="flex items-center space-x-2 p-3 rounded-lg bg-gray-50">
            {widgetModalMode === 'add' ? (
              <>
                <Plus className="w-5 h-5 text-green-600" />
                <span className="font-medium text-gray-900">Add Mode</span>
                <span className="text-sm text-gray-600">Select widgets to add to your workspace</span>
              </>
            ) : (
              <>
                <Minus className="w-5 h-5 text-red-600" />
                <span className="font-medium text-gray-900">Remove Mode</span>
                <span className="text-sm text-gray-600">Select widgets to remove from your workspace</span>
              </>
            )}
          </div>

          {/* Add Mode Content */}
          {widgetModalMode === 'add' && (
            <>
              {/* Zone Selection */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-900">
                  Target Zone
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {zones.map(zone => (
                    <button
                      key={zone.value}
                      onClick={() => setTargetZone(zone.value)}
                      disabled={!isZoneAvailable(zone.value)}
                      className={`p-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                        targetZone === zone.value
                          ? 'border-sage-700 bg-sage-100 text-sage-900'
                          : isZoneAvailable(zone.value)
                          ? 'border-gray-300 bg-white text-gray-700 hover:border-sage-700 hover:bg-sage-50'
                          : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {zone.label}
                      {!isZoneAvailable(zone.value) && (
                        <div className="text-xs mt-1">Full</div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Widget Selection */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-900">
                  Available Widgets
                </label>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 max-h-80 overflow-y-auto">
                  {availableWidgets.map(widget => {
                    const isSelected = selectedWidgets.includes(widget.type);
                    const alreadyExists = isWidgetAlreadyExists(widget.type);
                    
                    return (
                      <motion.button
                        key={widget.type}
                        onClick={() => !alreadyExists && handleWidgetSelect(widget.type)}
                        disabled={alreadyExists}
                        className={`p-4 rounded-lg border-2 text-left transition-all ${
                          isSelected
                            ? 'border-sage-700 bg-sage-100 shadow-md'
                            : alreadyExists
                            ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                            : `${widget.color} hover:shadow-md hover:scale-105`
                        }`}
                        whileHover={!alreadyExists ? { scale: 1.02 } : {}}
                        whileTap={!alreadyExists ? { scale: 0.98 } : {}}
                      >
                        <div className="flex items-start space-x-3">
                          <div className="text-2xl">{widget.icon}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium text-gray-900 text-sm">
                                {widget.name}
                              </h4>
                              {isSelected && (
                                <Check className="w-4 h-4 text-sage-700" />
                              )}
                              {alreadyExists && (
                                <span className="text-xs text-gray-500">Added</span>
                              )}
                            </div>
                            <p className="text-xs text-gray-600 mt-1">
                              {widget.description}
                            </p>
                          </div>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* Remove Mode Content */}
          {widgetModalMode === 'remove' && (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-900">
                Current Widgets
              </label>
              
              {widgets.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <div className="text-4xl mb-3">📭</div>
                  <p className="text-sm">No widgets to remove</p>
                  <p className="text-xs">Add some widgets first!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto">
                  {widgets.map(widget => {
                    const widgetInfo = availableWidgets.find(w => w.type === widget.type);
                    const isMarkedForRemoval = widgetsToRemove.includes(widget.id);
                    
                    return (
                      <motion.button
                        key={widget.id}
                        onClick={() => handleWidgetRemove(widget.id)}
                        className={`p-4 rounded-lg border-2 text-left transition-all ${
                          isMarkedForRemoval
                            ? 'border-red-500 bg-red-50 shadow-md'
                            : `${widgetInfo?.color || 'bg-gray-100 border-gray-300'} hover:shadow-md hover:scale-105`
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="flex items-start space-x-3">
                          <div className="text-2xl">{widgetInfo?.icon || '📦'}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium text-gray-900 text-sm">
                                {widgetInfo?.name || 'Unknown Widget'}
                              </h4>
                              <div className="flex items-center space-x-2">
                                <span className="text-xs text-gray-500 capitalize">
                                  {widget.zone}
                                </span>
                                {isMarkedForRemoval ? (
                                  <StopCircle className="w-4 h-4 text-red-600" />
                                ) : (
                                  <div className="w-4 h-4 border border-gray-400 rounded"></div>
                                )}
                              </div>
                            </div>
                            <p className="text-xs text-gray-600 mt-1">
                              {widgetInfo?.description || 'Custom widget'}
                            </p>
                          </div>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4 border-t border-gray-200">
            <Button
              onClick={handleSave}
              disabled={
                (widgetModalMode === 'add' && selectedWidgets.length === 0) ||
                (widgetModalMode === 'remove' && widgetsToRemove.length === 0)
              }
              className="flex-1"
            >
              <Check className="w-4 h-4 mr-2" />
              {widgetModalMode === 'add' 
                ? `Add ${selectedWidgets.length} Widget${selectedWidgets.length !== 1 ? 's' : ''}`
                : `Remove ${widgetsToRemove.length} Widget${widgetsToRemove.length !== 1 ? 's' : ''}`
              }
            </Button>
            
            <Button
              variant="outline"
              onClick={closeWidgetModal}
              className="flex-1"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          </div>

          {/* Keyboard Shortcuts Help */}
          <div className="text-xs text-gray-500 text-center pt-2 border-t border-gray-100">
            <p>Keyboard shortcuts: <kbd className="px-1 py-0.5 bg-gray-200 rounded">Alt + +</kbd> to add widgets, <kbd className="px-1 py-0.5 bg-gray-200 rounded">Alt + -</kbd> to remove widgets</p>
          </div>
        </div>
      </Modal>

      {/* Confirmation Dialog */}
      <ConfirmationDialog />
    </>
  );
};

const ConfirmationDialog: React.FC = () => {
  const {
    showConfirmDialog,
    confirmDialogMessage,
    confirmDialogAction,
    closeConfirmDialog,
  } = useUIStore();

  const handleConfirm = () => {
    if (confirmDialogAction) {
      confirmDialogAction();
    }
    closeConfirmDialog();
  };

  return (
    <Modal
      isOpen={showConfirmDialog}
      onClose={closeConfirmDialog}
      title="Confirm Action"
      size="sm"
    >
      <div className="space-y-4">
        <p className="text-gray-700">{confirmDialogMessage}</p>
        
        <div className="flex space-x-3">
          <Button onClick={handleConfirm} variant="danger" className="flex-1">
            Yes, Continue
          </Button>
          <Button onClick={closeConfirmDialog} variant="outline" className="flex-1">
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
};