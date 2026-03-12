import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { StopCircle, Check, X, Package, Plus, Trash2 } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useUIStore } from '../../store/uiStore';
import { useLayoutStore } from '../../store/layoutStore';
import { WidgetType, WidgetZone } from '../../types';
import { widgetConfig, widgetZones } from '../../constants/widgets';
import { getOpenAIKeyError, getWeatherKeyError } from '../../utils/apiKeyValidation';
import { KeyboardShortcutsHelp } from '../ui/KeyboardShortcutsHelp';

type ManageTab = 'add' | 'remove';

export const WidgetManagementModal: React.FC = () => {
  const {
    isWidgetModalOpen,
    widgetModalMode,
    selectedZone,
    pendingChanges,
    closeWidgetModal,
    setPendingChanges,
  } = useUIStore();

  const { widgets, addWidget, removeWidget, getWidgetsByZone, settings, updateSettings } = useLayoutStore();

  const [activeTab, setActiveTab] = useState<ManageTab>('add');
  const [selectedWidgets, setSelectedWidgets] = useState<WidgetType[]>([]);
  const [selectedWidgetZones, setSelectedWidgetZones] = useState<Map<WidgetType, WidgetZone>>(new Map());
  const [widgetsToRemove, setWidgetsToRemove] = useState<string[]>([]);
  const [openaiKey, setOpenaiKey] = useState('');
  const [weatherKey, setWeatherKey] = useState('');
  const [keyErrors, setKeyErrors] = useState<{ openai?: string; weather?: string }>({});

  // When modal opens, reset state and set initial tab from open mode
  useEffect(() => {
    if (isWidgetModalOpen) {
      setActiveTab(widgetModalMode);
      setSelectedWidgets([]);
      setSelectedWidgetZones(new Map());
      setWidgetsToRemove([]);
      setOpenaiKey(settings.apiKeys?.openai || '');
      setWeatherKey(settings.apiKeys?.weather || '');
      setKeyErrors({});
      setPendingChanges(false);
    }
  }, [isWidgetModalOpen, widgetModalMode, setPendingChanges, settings.apiKeys?.openai, settings.apiKeys?.weather]);

  const handleWidgetSelect = (type: WidgetType) => {
    const newSelection = selectedWidgets.includes(type)
      ? selectedWidgets.filter(w => w !== type)
      : [...selectedWidgets, type];

    if (newSelection.includes(type)) {
      setSelectedWidgetZones((prev) => new Map(prev).set(type, selectedZone || 'right'));
    } else {
      setSelectedWidgetZones((prev) => {
        const next = new Map(prev);
        next.delete(type);
        return next;
      });
    }

    setSelectedWidgets(newSelection);
    setPendingChanges(newSelection.length > 0);
  };

  const handleWidgetZoneChange = (type: WidgetType, zone: WidgetZone) => {
    setSelectedWidgetZones((prev) => new Map(prev).set(type, zone));
  };

  const handleWidgetRemove = (widgetId: string) => {
    const newRemoval = widgetsToRemove.includes(widgetId)
      ? widgetsToRemove.filter(id => id !== widgetId)
      : [...widgetsToRemove, widgetId];

    setWidgetsToRemove(newRemoval);
    setPendingChanges(newRemoval.length > 0);
  };

  const handleApplyChanges = () => {
    if (selectedWidgets.length > 0) {
      const openaiSelected = selectedWidgets.includes('ai-chat');
      const weatherSelected = selectedWidgets.includes('weather');
      const openaiError = openaiSelected ? getOpenAIKeyError(openaiKey, true) : '';
      const weatherError = weatherSelected ? getWeatherKeyError(weatherKey, true) : '';

      if (openaiError || weatherError) {
        setKeyErrors({
          openai: openaiError || undefined,
          weather: weatherError || undefined,
        });
        return;
      }

      selectedWidgets.forEach((type) => {
        const zone = selectedWidgetZones.get(type) ?? selectedZone ?? 'right';
        addWidget(type, zone);
      });

      if (openaiSelected || weatherSelected) {
        updateSettings({
          apiKeys: {
            ...settings.apiKeys,
            openai: openaiSelected ? openaiKey.trim() : settings.apiKeys?.openai,
            weather: weatherSelected ? weatherKey.trim() : settings.apiKeys?.weather,
          },
        });
      }
    }

    widgetsToRemove.forEach((widgetId) => removeWidget(widgetId));

    setSelectedWidgets([]);
    setSelectedWidgetZones(new Map());
    setWidgetsToRemove([]);
    setPendingChanges(false);
    closeWidgetModal();
  };

  const hasPendingAdd = selectedWidgets.length > 0;
  const hasPendingRemove = widgetsToRemove.length > 0;
  const hasAnyPending = hasPendingAdd || hasPendingRemove;

  const widgetCountInZone = (zone: WidgetZone) => {
    const current = getWidgetsByZone(zone).length;
    const fromSelected = [...selectedWidgets].filter(
      (t) => (selectedWidgetZones.get(t) ?? 'right') === zone && !widgets.some((w) => w.type === t)
    ).length;
    return current + fromSelected;
  };

  const isZoneAvailable = (zone: WidgetZone) => {
    return widgetCountInZone(zone) < 3;
  };

  const getExistingWidgetTypes = () => {
    return new Set(widgets.map((w) => w.type));
  };

  const isWidgetAlreadyExists = (type: WidgetType) => {
    return getExistingWidgetTypes().has(type);
  };

  return (
    <>
      <Modal
        isOpen={isWidgetModalOpen}
        onClose={closeWidgetModal}
        title="Manage widgets"
        size="lg"
      >
        <div className="space-y-6">
          {/* Tabs: Add | Remove */}
          <div className="flex rounded-lg border border-neutral-300 dark:border-neutral-700 p-1 bg-neutral-100 dark:bg-neutral-800">
            <button
              type="button"
              onClick={() => setActiveTab('add')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'add'
                  ? 'bg-white dark:bg-neutral-700 text-sage-800 dark:text-sage-400 shadow-sm'
                  : 'text-neutral-600 dark:text-neutral-textMuted hover:text-neutral-900 dark:hover:text-neutral-text'
              }`}
              aria-pressed={activeTab === 'add'}
              aria-label="Add widgets tab"
            >
              <Plus className="w-4 h-4" />
              Add
              {(widgetConfig.length - getExistingWidgetTypes().size) > 0 && (
                <span className="text-xs opacity-75">({widgetConfig.length - getExistingWidgetTypes().size} available)</span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('remove')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'remove'
                  ? 'bg-white dark:bg-neutral-700 text-sage-800 dark:text-sage-400 shadow-sm'
                  : 'text-neutral-600 dark:text-neutral-textMuted hover:text-neutral-900 dark:hover:text-neutral-text'
              }`}
              aria-pressed={activeTab === 'remove'}
              aria-label="Remove widgets tab"
            >
              <Trash2 className="w-4 h-4" />
              Remove
              {widgets.length > 0 && (
                <span className="text-xs opacity-75">({widgets.length} active)</span>
              )}
            </button>
          </div>

          {/* Add tab content */}
          {activeTab === 'add' && (
            <>
              <p className="text-sm text-neutral-600 dark:text-neutral-textMuted">
                Select widgets to add and choose their panel. You can also switch to Remove to disable widgets.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto">
                {widgetConfig.map((widget) => {
                  const isSelected = selectedWidgets.includes(widget.type);
                  const alreadyExists = isWidgetAlreadyExists(widget.type);
                  const effectiveZone = selectedWidgetZones.get(widget.type) ?? selectedZone ?? 'right';
                  const showApiKey = isSelected && widget.apiKeyType;

                  return (
                    <div
                      key={widget.type}
                      className={`p-3 border rounded-lg transition-colors ${
                        isSelected
                          ? 'border-sage-700 bg-sage-100 dark:bg-sage-400/20'
                          : alreadyExists
                          ? 'border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 opacity-50'
                          : 'border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:bg-sage-50 dark:hover:bg-neutral-800'
                      }`}
                    >
                      <label
                        className={`flex items-start space-x-3 ${!alreadyExists ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                      >
                        <div className="text-neutral-500 dark:text-neutral-textMuted" aria-hidden="true">
                            {React.createElement(widget.icon, { className: 'w-6 h-6' })}
                          </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-neutral-900 dark:text-neutral-text">
                              {widget.name}
                            </span>
                            {!alreadyExists && (
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleWidgetSelect(widget.type)}
                                className="w-4 h-4 text-sage-900 rounded"
                              />
                            )}
                            {alreadyExists && (
                              <span className="text-xs text-neutral-500 dark:text-neutral-textMuted">Added</span>
                            )}
                          </div>
                          <p className="text-xs text-neutral-600 dark:text-neutral-textMuted mt-1">
                            {widget.description}
                          </p>
                        </div>
                      </label>

                      {isSelected && !alreadyExists && (
                        <div className="mt-3 pt-3 border-t border-neutral-200 dark:border-neutral-700">
                          <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-textMuted mb-1.5">
                            Panel
                          </label>
                          <div className="flex flex-wrap gap-1.5">
                            {widgetZones.map((zone) => (
                              <button
                                key={zone.value}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleWidgetZoneChange(widget.type, zone.value);
                                }}
                                disabled={!isZoneAvailable(zone.value) && effectiveZone !== zone.value}
                                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                                  effectiveZone === zone.value
                                    ? 'bg-sage-700 text-white dark:bg-sage-600'
                                    : isZoneAvailable(zone.value) || effectiveZone === zone.value
                                    ? 'bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-sage-200 dark:hover:bg-sage-800'
                                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 cursor-not-allowed'
                                }`}
                              >
                                {zone.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {showApiKey && widget.apiKeyType === 'openai' && (
                        <div
                          className="mt-3 pt-3 border-t border-neutral-200 dark:border-neutral-700"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Input
                            label="OpenAI API Key"
                            type="password"
                            value={openaiKey}
                            onChange={(e) => {
                              setOpenaiKey(e.target.value);
                              if (keyErrors.openai) setKeyErrors((prev) => ({ ...prev, openai: undefined }));
                            }}
                            onBlur={() => {
                              setKeyErrors((prev) => ({
                                ...prev,
                                openai: getOpenAIKeyError(openaiKey) || undefined,
                              }));
                            }}
                            placeholder="sk-..."
                            hint="Required for AI Chat"
                            error={keyErrors.openai}
                          />
                        </div>
                      )}

                      {showApiKey && widget.apiKeyType === 'weather' && (
                        <div
                          className="mt-3 pt-3 border-t border-neutral-200 dark:border-neutral-700"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Input
                            label="Weather API Key"
                            type="password"
                            value={weatherKey}
                            onChange={(e) => {
                              setWeatherKey(e.target.value);
                              if (keyErrors.weather) setKeyErrors((prev) => ({ ...prev, weather: undefined }));
                            }}
                            onBlur={() => {
                              setKeyErrors((prev) => ({
                                ...prev,
                                weather: getWeatherKeyError(weatherKey) || undefined,
                              }));
                            }}
                            placeholder="Your weather API key"
                            hint="Required for Weather"
                            error={keyErrors.weather}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* Remove tab content */}
          {activeTab === 'remove' && (
            <div className="space-y-3">
              <p className="text-sm text-neutral-600 dark:text-neutral-textMuted">
                Select widgets to remove from your layout. You can also switch to Add to enable more widgets.
              </p>

              {widgets.length === 0 ? (
                <div className="text-center py-12 text-neutral-500 dark:text-neutral-textMuted">
                  <div className="text-4xl mb-3">📭</div>
                  <p className="text-sm">No widgets to remove</p>
                  <p className="text-xs">Use the Add tab to enable widgets first.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto">
                  {widgets.map((widget) => {
                    const widgetInfo = widgetConfig.find((w) => w.type === widget.type);
                    const isMarkedForRemoval = widgetsToRemove.includes(widget.id);

                    return (
                      <motion.button
                        key={widget.id}
                        onClick={() => handleWidgetRemove(widget.id)}
                        className={`p-4 rounded-lg border-2 text-left transition-all ${
                          isMarkedForRemoval
                            ? 'border-red-500 bg-red-50 dark:bg-red-900/20 shadow-md'
                            : 'border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:bg-sage-50 dark:hover:bg-neutral-700'
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="flex items-start space-x-3">
                          <div className="text-neutral-500 dark:text-neutral-textMuted">
                                {widgetInfo?.icon ? React.createElement(widgetInfo.icon, { className: 'w-6 h-6' }) : React.createElement(Package, { className: 'w-6 h-6' })}
                              </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium text-neutral-900 dark:text-neutral-text text-sm">
                                {widgetInfo?.name || 'Unknown Widget'}
                              </h4>
                              <div className="flex items-center space-x-2">
                                <span className="text-xs text-neutral-500 dark:text-neutral-textMuted capitalize">
                                  {widget.zone}
                                </span>
                                {isMarkedForRemoval ? (
                                  <StopCircle className="w-4 h-4 text-red-600" />
                                ) : (
                                  <div className="w-4 h-4 border border-neutral-400 rounded" />
                                )}
                              </div>
                            </div>
                            <p className="text-xs text-neutral-600 dark:text-neutral-textMuted mt-1">
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
          <div className="flex space-x-3 pt-4 border-t border-gray-200 dark:border-neutral-700">
            <Button
              onClick={handleApplyChanges}
              disabled={!hasAnyPending}
              className="flex-1"
            >
              <Check className="w-4 h-4 mr-2" />
              {hasPendingAdd && hasPendingRemove
                ? `Apply: Add ${selectedWidgets.length}, Remove ${widgetsToRemove.length}`
                : hasPendingAdd
                ? `Add ${selectedWidgets.length} Widget${selectedWidgets.length !== 1 ? 's' : ''}`
                : hasPendingRemove
                ? `Remove ${widgetsToRemove.length} Widget${widgetsToRemove.length !== 1 ? 's' : ''}`
                : 'Apply changes'}
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

          <KeyboardShortcutsHelp />
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
        <p className="text-gray-700 dark:text-neutral-textMuted">{confirmDialogMessage}</p>
        
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