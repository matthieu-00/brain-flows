import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Settings, 
  LogOut, 
  SaveAll, 
  ChevronDown,
  Maximize, 
  Minimize, 
  User,
  Signature,
  FilePlus,
  Sun,
  Moon,
  Monitor,
  Bot,
  MessageSquare,
  PanelLeftClose,
  PanelRightClose,
  Store,
} from 'lucide-react';
import { ExportFormat } from '../../types';
import { useAuthStore } from '../../store/authStore';
import { useDocumentStore } from '../../store/documentStore';
import { useLayoutStore } from '../../store/layoutStore';
import { useAgentStore } from '../../store/agentStore';
import type { AgentPanelSide } from '../../store/agentStore';
import { Button } from '../ui/Button';
import { SettingsModal } from './SettingsModal';
import { NewDocumentPrompt } from '../editor/NewDocumentPrompt';

export const Header: React.FC = () => {
  const { user, logout } = useAuthStore();
  const { saveDocument, exportDocument, createDocument, updateDocument, hasUnsavedChanges, currentDocument } = useDocumentStore();
  const { distractionFreeMode, toggleDistractionFreeMode, settings, updateSettings } = useLayoutStore();
  const [showSettings, setShowSettings] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNewDocPrompt, setShowNewDocPrompt] = useState(false);
  const [showSaveDropdown, setShowSaveDropdown] = useState(false);
  const [showNewDocDropdown, setShowNewDocDropdown] = useState(false);
  const [showAgentDropdown, setShowAgentDropdown] = useState(false);
  const [pendingNewDocFormat, setPendingNewDocFormat] = useState<ExportFormat | null>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const saveDropdownRef = useRef<HTMLDivElement>(null);
  const newDocDropdownRef = useRef<HTMLDivElement>(null);
  const agentDropdownRef = useRef<HTMLDivElement>(null);
  const { agentPanelSide, setAgentPanelSide, openAgentChat } = useAgentStore();
  const navigate = useNavigate();
  const location = useLocation();
  const isMarketplace = location.pathname === '/marketplace';

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showUserMenu && userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
      if (showSaveDropdown && saveDropdownRef.current && !saveDropdownRef.current.contains(e.target as Node)) {
        setShowSaveDropdown(false);
      }
      if (showNewDocDropdown && newDocDropdownRef.current && !newDocDropdownRef.current.contains(e.target as Node)) {
        setShowNewDocDropdown(false);
      }
      if (showAgentDropdown && agentDropdownRef.current && !agentDropdownRef.current.contains(e.target as Node)) {
        setShowAgentDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showUserMenu, showSaveDropdown, showNewDocDropdown, showAgentDropdown]);

  const docExportFormat = currentDocument?.exportFormat ?? settings.defaultFileType ?? settings.exportFormat;

  const handleExport = (format?: ExportFormat) => {
    exportDocument(format ?? docExportFormat);
    setShowSaveDropdown(false);
  };

  const handleSetDocumentFormat = (format: ExportFormat) => {
    if (currentDocument) {
      updateDocument(currentDocument.id, { exportFormat: format });
    }
    setShowSaveDropdown(false);
  };

  const handleSave = () => {
    saveDocument();
  };

  const hasContent = currentDocument && (
    currentDocument.content.replace(/<[^>]*>/g, '').trim().length > 0 ||
    currentDocument.title !== 'Untitled Document'
  );

  const handleNewDocument = (format?: ExportFormat) => {
    if (hasContent && hasUnsavedChanges) {
      setPendingNewDocFormat(format ?? null);
      setShowNewDocPrompt(true);
    } else {
      createDocument(undefined, format);
    }
    setShowNewDocDropdown(false);
  };

  const handleSaveAndNew = () => {
    saveDocument();
    createDocument(undefined, pendingNewDocFormat ?? undefined);
    setPendingNewDocFormat(null);
    setShowNewDocPrompt(false);
  };

  const handleExportAndNew = () => {
    exportDocument(docExportFormat);
    createDocument(undefined, pendingNewDocFormat ?? undefined);
    setPendingNewDocFormat(null);
    setShowNewDocPrompt(false);
  };

  const handleDiscardAndNew = () => {
    createDocument(undefined, pendingNewDocFormat ?? undefined);
    setPendingNewDocFormat(null);
    setShowNewDocPrompt(false);
  };

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="bg-cream-50 dark:bg-neutral-800 border-b border-neutral-300 dark:border-neutral-700 shadow-sm sticky top-0 z-40"
      >
        <div className="px-6 py-3 flex items-center justify-between">
          {/* Left side */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Signature className="w-6 h-6 text-sage-900 dark:text-sage-400" />
              <h1 className="font-display text-xl font-bold text-neutral-900 dark:text-neutral-text">brainsflow.io</h1>
            </div>
            <button
              onClick={() => navigate('/marketplace')}
              className={`text-sm font-medium transition-colors flex items-center gap-1.5 ${
                isMarketplace
                  ? 'text-sage-700 dark:text-sage-400'
                  : 'text-neutral-600 dark:text-neutral-textMuted hover:text-sage-700 dark:hover:text-sage-400'
              }`}
            >
              <Store className="w-4 h-4" />
              Marketplace
            </button>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-2">
            {/* New Document Split Button */}
            <div className="relative hidden sm:flex" ref={newDocDropdownRef}>
              <div className="flex rounded-lg border border-sage-700 dark:border-sage-600 overflow-hidden shadow-sm">
                <button
                  type="button"
                  onClick={() => handleNewDocument()}
                  className="px-3 py-1.5 flex items-center gap-1.5 text-sm font-medium bg-sage-900 dark:bg-sage-600 text-white hover:bg-sage-700 dark:hover:bg-sage-500 border-r border-sage-700 dark:border-sage-500 transition-colors"
                  title="New document"
                  aria-label="Create new document"
                >
                  <FilePlus className="w-4 h-4" />
                  New
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewDocDropdown((prev) => !prev)}
                  className="px-1.5 py-1.5 flex items-center bg-sage-100 dark:bg-sage-900/30 hover:bg-sage-200 dark:hover:bg-sage-900/50 text-neutral-900 dark:text-neutral-text transition-colors"
                  title="Format for new document"
                  aria-label="Choose format for new document"
                  aria-expanded={showNewDocDropdown}
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>

              {showNewDocDropdown && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  className="absolute right-0 mt-2 w-56 bg-white dark:bg-neutral-surface rounded-lg shadow-lg border border-neutral-200 dark:border-neutral-700 py-1 z-50"
                >
                  <div className="px-3 py-2 text-xs font-medium text-neutral-500 dark:text-neutral-textMuted">
                    Format for this document
                  </div>
                  {(['pdf', 'docx', 'txt', 'md'] as const).map((format) => (
                    <button
                      key={format}
                      type="button"
                      onClick={() => handleNewDocument(format)}
                      className="w-full px-3 py-2 text-left text-sm text-neutral-900 dark:text-neutral-text hover:bg-sage-100 dark:hover:bg-neutral-700 transition-colors capitalize"
                    >
                      {format === 'md' ? 'Markdown' : format === 'txt' ? 'Plain text' : format === 'docx' ? 'Word document' : 'PDF'}
                    </button>
                  ))}
                </motion.div>
              )}
            </div>

            {/* Save/Export Split Button */}
            <div className="relative hidden sm:flex" ref={saveDropdownRef}>
              <div className="flex rounded-lg border border-sage-700 dark:border-sage-600 overflow-hidden shadow-sm">
                <button
                  type="button"
                  onClick={handleSave}
                  className="px-3 py-1.5 flex items-center gap-1.5 text-sm font-medium bg-sage-900 dark:bg-sage-600 text-white hover:bg-sage-700 dark:hover:bg-sage-500 border-r border-sage-700 dark:border-sage-500 transition-colors"
                  title="Save"
                  aria-label="Save document"
                >
                  <SaveAll className="w-4 h-4" />
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setShowSaveDropdown((prev) => !prev)}
                  className="px-1.5 py-1.5 flex items-center bg-sage-100 dark:bg-sage-900/30 hover:bg-sage-200 dark:hover:bg-sage-900/50 text-neutral-900 dark:text-neutral-text transition-colors"
                  title="Export options"
                  aria-label="Export options"
                  aria-expanded={showSaveDropdown}
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>

              {showSaveDropdown && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  className="absolute right-0 mt-2 w-56 bg-white dark:bg-neutral-surface rounded-lg shadow-lg border border-neutral-200 dark:border-neutral-700 py-1 z-50"
                >
                  <div className="px-3 py-2 text-xs font-medium text-neutral-500 dark:text-neutral-textMuted">
                    Export as
                  </div>
                  {(['pdf', 'docx', 'txt', 'md'] as const).map((format) => (
                    <button
                      key={format}
                      type="button"
                      onClick={() => handleExport(format)}
                      className="w-full px-3 py-2 text-left text-sm text-neutral-900 dark:text-neutral-text hover:bg-sage-100 dark:hover:bg-neutral-700 transition-colors capitalize"
                    >
                      {format === 'md' ? 'Markdown' : format === 'txt' ? 'Plain text' : format === 'docx' ? 'Word document' : 'PDF'}
                    </button>
                  ))}
                  <div className="my-1 border-t border-neutral-200 dark:border-neutral-700" />
                  <div className="px-3 py-2 text-xs font-medium text-neutral-500 dark:text-neutral-textMuted">
                    Format for this document
                  </div>
                  {(['pdf', 'docx', 'txt', 'md'] as const).map((format) => (
                    <button
                      key={format}
                      type="button"
                      onClick={() => handleSetDocumentFormat(format)}
                      className={`w-full px-3 py-2 text-left text-sm hover:bg-sage-100 dark:hover:bg-neutral-700 transition-colors capitalize flex items-center justify-between ${
                        docExportFormat === format
                          ? 'text-sage-800 dark:text-sage-400 font-medium bg-sage-50 dark:bg-sage-900/30'
                          : 'text-neutral-900 dark:text-neutral-text'
                      }`}
                    >
                      {format === 'md' ? 'Markdown' : format === 'txt' ? 'Plain text' : format === 'docx' ? 'Word document' : 'PDF'}
                    </button>
                  ))}
                </motion.div>
              )}
            </div>

            {/* AI Agent */}
            <div className="relative" ref={agentDropdownRef}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAgentDropdown((prev) => !prev)}
                title="AI Agent"
                aria-label="AI Agent"
                aria-expanded={showAgentDropdown}
              >
                <Bot className="w-4 h-4" />
              </Button>
              {showAgentDropdown && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  className="absolute right-0 mt-2 w-52 bg-white dark:bg-neutral-surface rounded-lg shadow-lg border border-neutral-200 dark:border-neutral-700 py-1 z-50"
                >
                  <button
                    type="button"
                    onClick={() => { openAgentChat(); setShowAgentDropdown(false); }}
                    className="w-full px-3 py-2 text-left text-sm text-neutral-900 dark:text-neutral-text hover:bg-sage-100 dark:hover:bg-neutral-700 flex items-center gap-2"
                  >
                    <MessageSquare className="w-4 h-4 opacity-70" />
                    Open chat
                  </button>
                  <div className="my-1 border-t border-neutral-200 dark:border-neutral-700" />
                  <div className="px-3 py-1.5 text-xs font-medium text-neutral-500 dark:text-neutral-textMuted">
                    Agent panel
                  </div>
                  {(['left', 'right'] as AgentPanelSide[]).map((side) => (
                    <button
                      key={side}
                      type="button"
                      onClick={() => { setAgentPanelSide(agentPanelSide === side ? null : side); setShowAgentDropdown(false); }}
                      className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 ${
                        agentPanelSide === side
                          ? 'text-sage-800 dark:text-sage-400 font-medium bg-sage-50 dark:bg-sage-900/30'
                          : 'text-neutral-900 dark:text-neutral-text hover:bg-sage-100 dark:hover:bg-neutral-700'
                      }`}
                    >
                      {side === 'left' ? <PanelLeftClose className="w-4 h-4" /> : <PanelRightClose className="w-4 h-4" />}
                      Panel on {side}
                    </button>
                  ))}
                  {agentPanelSide && (
                    <button
                      type="button"
                      onClick={() => { setAgentPanelSide(null); setShowAgentDropdown(false); }}
                      className="w-full px-3 py-2 text-left text-sm text-neutral-600 dark:text-neutral-textMuted hover:bg-sage-100 dark:hover:bg-neutral-700"
                    >
                      Hide panel
                    </button>
                  )}
                </motion.div>
              )}
            </div>

            {/* Distraction Free Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleDistractionFreeMode}
              title={distractionFreeMode ? 'Exit Focus Mode' : 'Enter Focus Mode'}
              aria-label={distractionFreeMode ? 'Exit Focus Mode' : 'Enter Focus Mode'}
            >
              {distractionFreeMode ? (
                <Minimize className="w-4 h-4" />
              ) : (
                <Maximize className="w-4 h-4" />
              )}
            </Button>

            {/* User Menu */}
            <div className="relative" ref={userMenuRef}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2"
                aria-label="User menu"
                aria-expanded={showUserMenu}
              >
                {(user?.avatar || settings.profile?.avatar) ? (
                  <img
                    src={(user?.avatar ?? settings.profile?.avatar) as string}
                    alt={user?.name ?? settings.profile?.displayName ?? 'Profile'}
                    className="w-6 h-6 rounded-full"
                  />
                ) : (
                  <User className="w-4 h-4" />
                )}
                <span className="hidden sm:inline text-sm">
                  {user?.name ?? settings.profile?.displayName ?? 'Profile'}
                </span>
              </Button>

              {showUserMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  className="absolute right-0 mt-2 w-56 bg-white dark:bg-neutral-800 rounded-lg shadow-lg border border-neutral-200 dark:border-neutral-700 py-1 z-50"
                >
                  <div className="px-4 py-2 border-b border-neutral-300 dark:border-neutral-700">
                    <div className="text-sm font-medium text-neutral-900 dark:text-neutral-text">
                      {user?.name ?? settings.profile?.displayName ?? 'Profile'}
                    </div>
                    <div className="text-xs text-neutral-600 dark:text-neutral-textMuted">
                      {user?.email ?? settings.profile?.email ?? ''}
                    </div>
                  </div>

                  <div className="px-4 py-2 border-b border-neutral-300 dark:border-neutral-700">
                    <div className="text-xs font-medium text-neutral-500 dark:text-neutral-textMuted mb-2">Theme</div>
                    <div className="flex rounded-lg border border-neutral-300 dark:border-neutral-600 overflow-hidden">
                      {(['light', 'dark', 'system'] as const).map((theme) => (
                        <button
                          key={theme}
                          type="button"
                          onClick={() => updateSettings({ theme })}
                          className={`flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-medium transition-colors ${
                            settings.theme === theme
                              ? 'bg-sage-100 dark:bg-sage-900/30 text-sage-800 dark:text-sage-400'
                              : 'bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-textMuted hover:bg-neutral-50 dark:hover:bg-neutral-700'
                          }`}
                          title={theme === 'system' ? 'Use system preference' : theme === 'dark' ? 'Dark mode' : 'Light mode'}
                        >
                          {theme === 'light' && <Sun className="w-3.5 h-3.5" />}
                          {theme === 'dark' && <Moon className="w-3.5 h-3.5" />}
                          {theme === 'system' && <Monitor className="w-3.5 h-3.5" />}
                          <span className="capitalize">{theme}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => {
                      setShowSettings(true);
                      setShowUserMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-neutral-900 dark:text-neutral-text hover:bg-sage-100 dark:hover:bg-neutral-800 flex items-center space-x-2"
                  >
                    <Settings className="w-4 h-4" />
                    <span>Settings</span>
                  </button>
                  {user && (
                    <button
                      onClick={() => {
                        logout();
                        setShowUserMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-neutral-900 dark:text-neutral-text hover:bg-sage-100 dark:hover:bg-neutral-800 flex items-center space-x-2"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  )}
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </motion.header>

      {/* Modals */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />

      <NewDocumentPrompt
        isOpen={showNewDocPrompt}
        onSaveAndNew={handleSaveAndNew}
        onExportAndNew={handleExportAndNew}
        onDiscardAndNew={handleDiscardAndNew}
        onCancel={() => {
          setShowNewDocPrompt(false);
          setPendingNewDocFormat(null);
        }}
      />
    </>
  );
};