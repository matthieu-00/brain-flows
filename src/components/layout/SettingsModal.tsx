import React, { useEffect, useRef, useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { CollapsibleSection } from '../ui/CollapsibleSection';
import { useLayoutStore } from '../../store/layoutStore';
import { useUIStore } from '../../store/uiStore';
import { AppSettings } from '../../types';
import { getWeatherKeyError } from '../../utils/apiKeyValidation';
import { KeyboardShortcutsSection } from '../ui/KeyboardShortcutsSection';
import { User, Camera, ExternalLink, Bot, LayoutGrid } from 'lucide-react';
import { useAgentStore } from '../../store/agentStore';
import {
  connectOpenClawAgent,
  disconnectOpenClawAgent,
  getOpenClawAgentStatus,
  isAgentBackendEnabled,
  type OpenClawAgentMapping,
} from '../../lib/agentClient';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { settings, updateSettings, widgets, resetLayout } = useLayoutStore();
  const openWidgetModal = useUIStore((state) => state.openWidgetModal);
  const { connectionStatus, setConnectionStatus } = useAgentStore();
  const [weatherKey, setWeatherKey] = useState(settings.apiKeys?.weather || '');
  const [keyErrors, setKeyErrors] = useState<{ weather?: string }>({});
  const [displayName, setDisplayName] = useState(settings.profile?.displayName || '');
  const [email, setEmail] = useState(settings.profile?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [agentIdInput, setAgentIdInput] = useState('');
  const [agentWorkspaceInput, setAgentWorkspaceInput] = useState('');
  const [agentProfileInput, setAgentProfileInput] = useState('');
  const [isConnectingAgent, setIsConnectingAgent] = useState(false);
  const [agentMapping, setAgentMapping] = useState<OpenClawAgentMapping | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasWeather = widgets.some((w) => w.type === 'weather' && w.isEnabled);

  useEffect(() => {
    if (isOpen) {
      setWeatherKey(settings.apiKeys?.weather || '');
      setDisplayName(settings.profile?.displayName || '');
      setEmail(settings.profile?.email || '');
      setKeyErrors({});
      setPasswordError(null);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      if (!isAgentBackendEnabled()) {
        setConnectionStatus('error', 'Supabase or agent backend is not configured.');
        setAgentMapping(null);
        return;
      }
      void getOpenClawAgentStatus()
        .then((status) => {
          setAgentMapping(status.mapping);
          setConnectionStatus(status.connected ? 'connected' : 'disconnected', status.mapping?.connection_error ?? null);
          if (status.mapping?.agent_id) setAgentIdInput(status.mapping.agent_id);
          if (status.mapping?.workspace_path) setAgentWorkspaceInput(status.mapping.workspace_path);
          if (status.mapping?.auth_profile_ref) setAgentProfileInput(status.mapping.auth_profile_ref);
        })
        .catch((error) => {
          setAgentMapping(null);
          setConnectionStatus('error', error instanceof Error ? error.message : 'Unable to fetch agent status.');
        });
    }
  }, [
    isOpen,
    settings.apiKeys?.weather,
    settings.profile?.displayName,
    settings.profile?.email,
    setConnectionStatus,
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
    const weatherError = hasWeather ? getWeatherKeyError(weatherKey, true) : getWeatherKeyError(weatherKey);
    const hasKeyErrors = Boolean(weatherError);

    if (hasKeyErrors) {
      setKeyErrors({
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
        <CollapsibleSection title="Profile" defaultOpen={false}>
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
        <CollapsibleSection title="Text editor settings" defaultOpen={false}>
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

            <div className="pt-2 border-t border-neutral-200 dark:border-neutral-700 space-y-2">
              <p className="text-sm font-medium text-neutral-900 dark:text-neutral-text">
                Layout reset
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-textMuted">
                Reset all panel sizes to default and remove all widgets. You can add widgets again from the header or Manage widgets below.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => resetLayout()}
                className="flex items-center gap-1.5"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                Reset layout
              </Button>
              <p className="text-xs text-neutral-500 dark:text-neutral-textMuted">
                You can also use the keyboard shortcut (see Keyboard shortcuts below). Default: Alt+0
              </p>
            </div>
          </div>
        </CollapsibleSection>

        {/* Agents / Integrations */}
        <CollapsibleSection title="Agents" defaultOpen={false}>
          <div className="space-y-4">
            <p className="text-sm text-neutral-600 dark:text-neutral-textMuted">
              Connect an AI agent to assist with writing, research, and document suggestions.
            </p>
            <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-sage-100 dark:bg-sage-900/30 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-sage-700 dark:text-sage-400" />
                </div>
                <div>
                  <p className="font-medium text-neutral-900 dark:text-neutral-text">OpenClaw</p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-textMuted">
              {connectionStatus === 'connected'
                      ? 'Connected'
                      : connectionStatus === 'error'
                        ? 'Connection error'
                        : 'Not connected'}
                  </p>
                </div>
              </div>
              {connectionStatus === 'connected' ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    setIsConnectingAgent(true);
                    try {
                      const status = await disconnectOpenClawAgent();
                      setAgentMapping(status.mapping);
                      setConnectionStatus('disconnected');
                    } catch (error) {
                      setConnectionStatus('error', error instanceof Error ? error.message : 'Could not disconnect agent.');
                    } finally {
                      setIsConnectingAgent(false);
                    }
                  }}
                  disabled={isConnectingAgent}
                >
                  Disconnect
                </Button>
              ) : (
                <Button
                  size="sm"
                  disabled={isConnectingAgent || !agentIdInput.trim()}
                  onClick={async () => {
                    if (!isAgentBackendEnabled()) {
                      setConnectionStatus('error', 'Supabase is not configured.');
                      return;
                    }
                    try {
                      setIsConnectingAgent(true);
                      const status = await connectOpenClawAgent({
                        agentId: agentIdInput.trim(),
                        workspacePath: agentWorkspaceInput.trim() || undefined,
                        authProfileRef: agentProfileInput.trim() || undefined,
                      });
                      setAgentMapping(status.mapping);
                      setConnectionStatus('connected');
                    } catch (error) {
                      setConnectionStatus(
                        'error',
                        error instanceof Error ? error.message : 'Could not connect to agent backend.'
                      );
                    } finally {
                      setIsConnectingAgent(false);
                    }
                  }}
                >
                  Connect agent
                </Button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input
                label="Dedicated agent ID"
                type="text"
                value={agentIdInput}
                onChange={(e) => setAgentIdInput(e.target.value)}
                placeholder="user-agent-123"
                hint="Required. Must be unique per app user."
              />
              <Input
                label="Auth profile reference"
                type="text"
                value={agentProfileInput}
                onChange={(e) => setAgentProfileInput(e.target.value)}
                placeholder="anthropic:default"
                hint="Optional OpenClaw auth profile alias."
              />
            </div>
            <Input
              label="Workspace path (optional)"
              type="text"
              value={agentWorkspaceInput}
              onChange={(e) => setAgentWorkspaceInput(e.target.value)}
              placeholder="/srv/openclaw/workspaces/user-123"
            />
            {agentMapping?.agent_id && (
              <p className="text-xs text-neutral-500 dark:text-neutral-textMuted">
                Connected mapping: `{agentMapping.agent_id}`{agentMapping.auth_profile_ref ? ` with profile ${agentMapping.auth_profile_ref}` : ''}
              </p>
            )}
            <p className="text-xs text-neutral-500 dark:text-neutral-textMuted">
              Each app user must map to a dedicated OpenClaw agent/workspace. Requests are blocked when no active mapping exists.
            </p>
          </div>
        </CollapsibleSection>

        {/* Widget Management - redirect to canonical modal */}
        <CollapsibleSection title="Widgets" defaultOpen={false}>
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

        {/* Keyboard Shortcuts */}
        <CollapsibleSection title="Keyboard shortcuts" defaultOpen={false}>
          <KeyboardShortcutsSection />
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
      </div>
    </Modal>
  );
};
