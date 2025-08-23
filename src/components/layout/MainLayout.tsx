import React from 'react';
import { motion } from 'framer-motion';
import { useLayoutStore } from '../../store/layoutStore';
import { RichTextEditor } from '../editor/RichTextEditor';
import { WidgetZone } from './WidgetZone';

export const MainLayout: React.FC = () => {
  const { distractionFreeMode, layoutConfig } = useLayoutStore();

  if (distractionFreeMode) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-4xl"
        >
          <RichTextEditor className="shadow-2xl" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Top Zone */}
      <WidgetZone
        zone="top"
        className="border-b"
      />

      {/* Main Content Area */}
      <div className="flex-1 flex">
        {/* Left Zone */}
        <WidgetZone
          zone="left"
          className="border-r"
        />

        {/* Central Editor */}
        <motion.div
          className="flex-1 flex items-center justify-center p-8"
          style={{
            minHeight: `calc(100vh - ${
              !layoutConfig.isTopCollapsed ? layoutConfig.topZoneHeight : 5
            }vh - ${
              !layoutConfig.isBottomCollapsed ? layoutConfig.bottomZoneHeight : 5
            }vh)`,
          }}
        >
          <RichTextEditor className="w-full max-w-4xl shadow-lg" />
        </motion.div>

        {/* Right Zone */}
        <WidgetZone
          zone="right"
          className="border-l"
        />
      </div>

      {/* Bottom Zone */}
      <WidgetZone
        zone="bottom"
        className="border-t"
      />
    </div>
  );
};