import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useLayoutStore } from '../../store/layoutStore';
import { WidgetType } from '../../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { settings, updateSettings, widgets, addWidget, removeWidget } = useLayoutStore();
  const [openaiKey, setOpenaiKey] = useState(settings.apiKeys?.openai || '');
  const [weatherKey, setWeatherKey] = useState(settings.apiKeys?.weather || '');

  const widgetTypes: { type: WidgetType; name: string; description: string; icon: string }[] = [
    { type: 'sticky-notes', name: 'Sticky Notes', description: 'Quick notes and flashcards', icon: '📝' },
    { type: 'flashcards', name: 'Flashcards', description: 'Study cards with flip animation', icon: '🃏' },
    { type: 'chess', name: 'Chess Game', description: 'Play chess with move history', icon: '♟️' },
    { type: 'sudoku', name: 'Sudoku', description: 'Brain training puzzles', icon: '🧩' },
    { type: 'fidget-tools', name: 'Fidget Tools', description: 'Stress relief tools', icon: '🎯' },
    { type: 'drawing-canvas', name: 'Drawing Canvas', description: 'Sketch and draw', icon: '🎨' },
    { type: 'ai-chat', name: 'AI Chat', description: 'Chat with AI assistant', icon: '🤖' },
    { type: 'timer', name: 'Pomodoro Timer', description: 'Focus timer sessions', icon: '⏱️' },
    { type: 'calculator', name: 'Calculator', description: 'Scientific calculator', icon: '🧮' },
    { type: 'weather', name: 'Weather', description: 'Local weather info', icon: '🌤️' },
  ];

  const handleSaveSettings = () => {
    updateSettings({
      apiKeys: {
        ...settings.apiKeys,
        openai: openaiKey,
        weather: weatherKey,
      },
    });
    onClose();
  };

  const isWidgetEnabled = (type: WidgetType) => {
    return widgets.some(widget => widget.type === type && widget.isEnabled);
  };

  const toggleWidget = (type: WidgetType) => {
    const existingWidget = widgets.find(widget => widget.type === type);
    
    if (existingWidget) {
      removeWidget(existingWidget.id);
    } else {
      addWidget(type, 'right'); // Default to right zone
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Settings"
      size="lg"
    >
      <div className="space-y-6">
        {/* Theme Settings */}
        <div>
          <h3 className="text-lg font-semibold text-neutral-900 mb-3">Appearance</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-neutral-900 mb-2">
                Theme
              </label>
              <select
                value={settings.theme}
                onChange={(e) => updateSettings({ theme: e.target.value as any })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-700 bg-white"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="system">System</option>
              </select>
            </div>
          </div>
        </div>

        {/* Auto-save Settings */}
        <div>
          <h3 className="text-lg font-semibold text-neutral-900 mb-3">Auto-save</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-neutral-900 mb-2">
                Auto-save interval (seconds)
              </label>
              <input
                type="number"
                min="5"
                max="300"
                value={settings.autoSaveInterval}
                onChange={(e) => updateSettings({ autoSaveInterval: parseInt(e.target.value) || 30 })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-700 bg-white"
              />
            </div>
          </div>
        </div>

        {/* API Keys */}
        <div>
          <h3 className="text-lg font-semibold text-neutral-900 mb-3">API Keys</h3>
          <div className="space-y-3">
            <Input
              label="OpenAI API Key"
              type="password"
              value={openaiKey}
              onChange={(e) => setOpenaiKey(e.target.value)}
              placeholder="sk-..."
              hint="Required for AI Chat widget"
            />
            
            <Input
              label="Weather API Key"
              type="password"
              value={weatherKey}
              onChange={(e) => setWeatherKey(e.target.value)}
              placeholder="Your weather API key"
              hint="Required for Weather widget"
            />
          </div>
        </div>

        {/* Widget Management */}
        <div>
          <h3 className="text-lg font-semibold text-neutral-900 mb-3">Widgets</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {widgetTypes.map((widget) => (
              <div
                key={widget.type}
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  isWidgetEnabled(widget.type)
                    ? 'border-sage-700 bg-sage-100'
                    : 'border-neutral-300 bg-white hover:bg-sage-100'
                }`}
                onClick={() => toggleWidget(widget.type)}
              >
                <div className="flex items-start space-x-3">
                  <div className="text-2xl">{widget.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-neutral-900">
                        {widget.name}
                      </h4>
                      <input
                        type="checkbox"
                        checked={isWidgetEnabled(widget.type)}
                        readOnly
                        className="w-4 h-4 text-sage-900 rounded"
                      />
                    </div>
                    <p className="text-xs text-neutral-600 mt-1">
                      {widget.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Export Settings */}
        <div>
          <h3 className="text-lg font-semibold text-neutral-900 mb-3">Export</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-neutral-900 mb-2">
                Default export format
              </label>
              <select
                value={settings.exportFormat}
                onChange={(e) => updateSettings({ exportFormat: e.target.value as any })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-700 bg-white"
              >
                <option value="pdf">PDF</option>
                <option value="docx">Word Document</option>
                <option value="txt">Plain Text</option>
              </select>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <Button onClick={handleSaveSettings} className="flex-1">
            Save Settings
          </Button>
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
};