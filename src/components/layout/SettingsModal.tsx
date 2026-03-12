import React, { useEffect, useRef, useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { CollapsibleSection } from '../ui/CollapsibleSection';
import { useLayoutStore } from '../../store/layoutStore';
import { useUIStore } from '../../store/uiStore';
import { AppSettings } from '../../types';
import { getOpenAIKeyError, getWeatherKeyError } from '../../utils/apiKeyValidation';
import { KeyboardShortcutsHelp } from '../ui/KeyboardShortcutsHelp';
import { User, Camera, ExternalLink } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { settings, updateSettings, widgets } = useLayoutStore();
  const openWidgetModal = useUIStore((state) => state.openWidgetModal);
  const [openaiKey, setOpenaiKey] = useState(settings.apiKeys?.openai || '');
  const [weatherKey, setWeatherKey] = useState(settings.apiKeys?.weather || '');
  const [keyErrors, setKeyErrors] = useState<{ openai?: string; weather?: string }>({});
  const [displayName, setDisplayName] = useState(settings.profile?.displayName || '');
  const [email, setEmail] = useState(settings.profile?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasAIChat = widgets.some((w) => w.type === 'ai-chat' && w.isEnabled);
  const hasWeather = widgets.some((w) => w.type === 'weather' && w.isEnabled);

  useEffect(() => {
    if (isOpen) {
      setOpenaiKey(settings.apiKeys?.openai || '');
      setWeatherKey(settings.apiKeys?.weather || '');
      setDisplayName(settings.profile?.displayName || '');
      setEmail(settings.profile?.email || '');
      setKeyErrors({});
      setPasswordError(null);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  }, [
    isOpen,
    settings.apiKeys?.openai,
    settings.apiKeys?.weather,
    settings.profile?.displayName,
    settings.profile?.email,
  ]);

  const editorFontOptions = [
    { label: 'Inter (Default)', value: 'Inter, ui-sans-serif, system-ui, sans-serif' },
    { label: 'System Sans', value: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif' },
    { label: 'Georgia', value: 'Georgia, Times New Roman, serif' },
    { label: 'Times New Roman', value: '"Times New Roman", Times, serif' },
    { label: 'Courier New', value: '"Courier New", Courier, monospace' },
    { label: 'Monaco', value: 'Monaco, Menlo, Consolas, monospace' },
  ];

  const fileTypeOptions = [
    { label: 'Markdown (.md)', value: 'md' },
    { label: 'Plain Text (.txt)', value: 'txt' },
    { label: 'PDF', value: 'pdf' },
    { label: 'Word Document (.docx)', value: 'docx' },
  ] as const;

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        updateSettings({
          profile: {
            ...settings.profile,
            avatar: reader.result as string,
          },
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveSettings = () => {
    const openaiError = hasAIChat ? getOpenAIKeyError(openaiKey, true) : getOpenAIKeyError(openaiKey);
    const weatherError = hasWeather ? getWeatherKeyError(weatherKey, true) : getWeatherKeyError(weatherKey);
    const hasKeyErrors = Boolean(openaiError || weatherError);

    if (hasKeyErrors) {
      setKeyErrors({
        openai: openaiError || undefined,
        weather: weatherError || undefined,
      });
      return;
    }

    if (newPassword || confirmPassword || currentPassword) {
      if (newPassword.length < 8) {
        setPasswordError('New password must be at least 8 characters');
        return;
      }
      if (newPassword !== confirmPassword) {
        setPasswordError('New passwords do not match');
        return;
      }
      setPasswordError(null);
    }

    updateSettings({
      apiKeys: {
        ...settings.apiKeys,
        openai: openaiKey.trim() || settings.apiKeys?.openai,
        weather: weatherKey.trim() || settings.apiKeys?.weather,
      },
      profile: {
        ...settings.profile,
        displayName: displayName.trim(),
        email: email.trim(),
      },
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Settings" size="lg">
      <div className="space-y-4">
        {/* Profile Section */}
        <CollapsibleSection title="Profile" defaultOpen={true}>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-20 h-20 rounded-full overflow-hidden border-2 border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors flex items-center justify-center group"
                >
                  {settings.profile?.avatar ? (
                    <img
                      src={settings.profile.avatar}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-10 h-10 text-neutral-500" />
                  )}
                  <span className="absolute inset-0 flex items-center justify-center bg-neutral-900/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                    <Camera className="w-6 h-6 text-white" />
                  </span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </div>
              <div className="flex-1">
                <p className="text-sm text-neutral-600 dark:text-neutral-textMuted mb-1">Profile picture</p>
                <p className="text-xs text-neutral-500 dark:text-neutral-textMuted">Click to upload a new photo</p>
              </div>
            </div>

            <Input
              label="Display name"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
            />

            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />

            <div className="pt-2 border-t border-neutral-200 dark:border-neutral-700">
              <h4 className="text-sm font-medium text-neutral-900 dark:text-neutral-text mb-2">Change password</h4>
              <div className="space-y-3">
                <Input
                  label="Current password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                />
                <Input
                  label="New password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setPasswordError(null);
                  }}
                  placeholder="••••••••"
                />
                <Input
                  label="Confirm new password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setPasswordError(null);
                  }}
                  placeholder="••••••••"
                  error={passwordError ?? undefined}
                />
                <p className="text-xs text-neutral-500 dark:text-neutral-textMuted">
                  Password changes are stored locally. Connect an account for cloud sync.
                </p>
              </div>
            </div>
          </div>
        </CollapsibleSection>

        {/* Text Editor Settings */}
        <CollapsibleSection title="Text editor settings" defaultOpen={true}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-900 dark:text-neutral-text mb-2">
                Editor font
              </label>
              <select
                value={settings.editorFontFamily || 'Inter, ui-sans-serif, system-ui, sans-serif'}
                onChange={(e) => updateSettings({ editorFontFamily: e.target.value })}
                className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-text"
              >
                {editorFontOptions.map((font) => (
                  <option key={font.label} value={font.value}>
                    {font.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-900 dark:text-neutral-text mb-2">
                Editor font size (px)
              </label>
              <input
                type="number"
                min="12"
                max="32"
                value={settings.editorFontSize || 18}
                onChange={(e) =>
                  updateSettings({
                    editorFontSize: Math.min(
                      32,
                      Math.max(12, parseInt(e.target.value, 10) || 18)
                    ),
                  })
                }
                className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-text"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-900 dark:text-neutral-text mb-2">
                Editor text color
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={settings.editorTextColor || '#2c2c2c'}
                  onChange={(e) => updateSettings({ editorTextColor: e.target.value })}
                  className="h-10 w-12 rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-1 cursor-pointer"
                />
                <input
                  type="text"
                  value={settings.editorTextColor || '#2c2c2c'}
                  onChange={(e) => updateSettings({ editorTextColor: e.target.value })}
                  className="flex-1 px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-text font-mono text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-900 dark:text-neutral-text mb-2">
                Default file type
              </label>
              <select
                value={settings.defaultFileType || 'md'}
                onChange={(e) =>
                  updateSettings({
                    defaultFileType: e.target.value as AppSettings['defaultFileType'],
                  })
                }
                className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-text"
              >
                {fileTypeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-textMuted">
                Preferred format for new documents and exports when not specified
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-900 dark:text-neutral-text mb-2">
                Default export format
              </label>
              <select
                value={settings.exportFormat}
                onChange={(e) =>
                  updateSettings({
                    exportFormat: e.target.value as AppSettings['exportFormat'],
                  })
                }
                className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-text"
              >
                <option value="pdf">PDF</option>
                <option value="docx">Word Document</option>
                <option value="md">Markdown</option>
                <option value="txt">Plain Text</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-900 dark:text-neutral-text mb-2">
                Auto-save interval (seconds)
              </label>
              <input
                type="number"
                min="5"
                max="300"
                value={settings.autoSaveInterval}
                onChange={(e) =>
                  updateSettings({ autoSaveInterval: parseInt(e.target.value) || 30 })
                }
                className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-text"
              />
            </div>
          </div>
        </CollapsibleSection>

        {/* Widget Management - redirect to canonical modal */}
        <CollapsibleSection title="Widgets" defaultOpen={true}>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-neutral-600 dark:text-neutral-textMuted">
                {widgets.length} widget{widgets.length !== 1 ? 's' : ''} active
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onClose();
                  setTimeout(() => openWidgetModal('add'), 150);
                }}
                className="flex items-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Manage widgets
              </Button>
            </div>

            {/* API key fields shown only when relevant widgets are active */}
            {hasAIChat && (
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
            )}

            {hasWeather && (
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
            )}
          </div>
        </CollapsibleSection>

        {/* Action Buttons */}
        <div className="flex space-x-3 pt-2">
          <Button onClick={handleSaveSettings} className="flex-1">
            Save Settings
          </Button>
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
        </div>

        <KeyboardShortcutsHelp />
      </div>
    </Modal>
  );
};
