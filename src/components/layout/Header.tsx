import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings, 
  LogOut, 
  Save, 
  Download, 
  Maximize, 
  Minimize, 
  User,
  FileText,
  FilePlus,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useDocumentStore } from '../../store/documentStore';
import { useLayoutStore } from '../../store/layoutStore';
import { Button } from '../ui/Button';
import { SettingsModal } from './SettingsModal';
import { NewDocumentPrompt } from '../editor/NewDocumentPrompt';

export const Header: React.FC = () => {
  const { user, logout } = useAuthStore();
  const { saveDocument, exportDocument, createDocument, hasUnsavedChanges, currentDocument } = useDocumentStore();
  const { distractionFreeMode, toggleDistractionFreeMode } = useLayoutStore();
  const [showSettings, setShowSettings] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNewDocPrompt, setShowNewDocPrompt] = useState(false);

  const handleExport = (format: 'pdf' | 'docx' | 'txt') => {
    exportDocument(format);
  };

  const handleSave = () => {
    saveDocument();
  };

  const handleNewDocument = () => {
    const hasContent = currentDocument && (
      currentDocument.content.replace(/<[^>]*>/g, '').trim().length > 0 ||
      currentDocument.title !== 'Untitled Document'
    );
    if (hasContent && hasUnsavedChanges) {
      setShowNewDocPrompt(true);
    } else {
      createDocument();
    }
  };

  const handleSaveAndNew = () => {
    saveDocument();
    createDocument();
    setShowNewDocPrompt(false);
  };

  const handleExportAndNew = () => {
    exportDocument('pdf');
    createDocument();
    setShowNewDocPrompt(false);
  };

  const handleDiscardAndNew = () => {
    createDocument();
    setShowNewDocPrompt(false);
  };

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="bg-cream-50 border-b border-neutral-300 shadow-sm sticky top-0 z-40"
      >
        <div className="px-6 py-3 flex items-center justify-between">
          {/* Left side */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <FileText className="w-6 h-6 text-sage-900" />
              <h1 className="text-xl font-bold text-neutral-900">brainsflow.io</h1>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-2">
            {/* New Document */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNewDocument}
              className="hidden sm:flex"
              title="New document"
            >
              <FilePlus className="w-4 h-4 mr-1" />
              New
            </Button>

            {/* Save Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleSave}
              className="hidden sm:flex"
            >
              <Save className="w-4 h-4 mr-1" />
              Save
            </Button>

            {/* Export Dropdown */}
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('pdf')}
                className="hidden sm:flex"
              >
                <Download className="w-4 h-4 mr-1" />
                Export
              </Button>
            </div>

            {/* Distraction Free Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleDistractionFreeMode}
              title={distractionFreeMode ? 'Exit Focus Mode' : 'Enter Focus Mode'}
            >
              {distractionFreeMode ? (
                <Minimize className="w-4 h-4" />
              ) : (
                <Maximize className="w-4 h-4" />
              )}
            </Button>

            {/* User Menu */}
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2"
              >
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-6 h-6 rounded-full"
                  />
                ) : (
                  <User className="w-4 h-4" />
                )}
                <span className="hidden sm:inline text-sm">{user?.name}</span>
              </Button>

              {showUserMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50"
                >
                  <div className="px-4 py-2 border-b border-neutral-300">
                    <div className="text-sm font-medium text-neutral-900">
                      {user?.name}
                    </div>
                    <div className="text-xs text-neutral-600">
                      {user?.email}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => {
                      setShowSettings(true);
                      setShowUserMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-neutral-900 hover:bg-sage-100 flex items-center space-x-2"
                  >
                    <Settings className="w-4 h-4" />
                    <span>Settings</span>
                  </button>
                  <button
                    onClick={() => {
                      logout();
                      setShowUserMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-neutral-900 hover:bg-sage-100 flex items-center space-x-2"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
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
        onCancel={() => setShowNewDocPrompt(false)}
      />
    </>
  );
};