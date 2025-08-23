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
  FileText
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useDocumentStore } from '../../store/documentStore';
import { useLayoutStore } from '../../store/layoutStore';
import { Button } from '../ui/Button';
import { SettingsModal } from './SettingsModal';

export const Header: React.FC = () => {
  const { user, logout } = useAuthStore();
  const { currentDocument, saveDocument, exportDocument } = useDocumentStore();
  const { distractionFreeMode, toggleDistractionFreeMode } = useLayoutStore();
  const [showSettings, setShowSettings] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleExport = (format: 'pdf' | 'docx' | 'txt') => {
    exportDocument(format);
  };

  const handleSave = () => {
    saveDocument();
  };

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40"
      >
        <div className="px-6 py-3 flex items-center justify-between">
          {/* Left side */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <FileText className="w-6 h-6 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-900">WriteSpace</h1>
            </div>

            <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-600">
              <span>{currentDocument?.title || 'Untitled Document'}</span>
              <span>•</span>
              <span>{currentDocument?.wordCount || 0} words</span>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-2">
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

            {/* Settings */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(true)}
            >
              <Settings className="w-4 h-4" />
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
                  <div className="px-4 py-2 border-b border-gray-100">
                    <div className="text-sm font-medium text-gray-900">
                      {user?.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {user?.email}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => {
                      logout();
                      setShowUserMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
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
    </>
  );
};