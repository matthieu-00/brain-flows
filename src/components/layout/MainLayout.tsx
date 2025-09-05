import React from 'react';
import { motion } from 'framer-motion';
import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels';
import { useLayoutStore } from '../../store/layoutStore';
import { RichTextEditor } from '../editor/RichTextEditor';
import { WidgetZone } from './WidgetZone';

export const MainLayout: React.FC = () => {
  const { distractionFreeMode, layoutConfig, setZoneSize, toggleZoneCollapsed, isZoneCollapsed } = useLayoutStore();

  if (distractionFreeMode) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center p-8">
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
    <div className="min-h-screen bg-cream-100">
      <PanelGroup direction="vertical" className="min-h-screen">
        {/* Top Zone */}
        <Panel
          defaultSize={isZoneCollapsed('top') ? 5 : layoutConfig.topZoneSize}
          minSize={5}
          collapsedSize={5}
          collapsible
          collapsed={isZoneCollapsed('top')}
          onResize={(size) => setZoneSize('top', size)}
        >
          <WidgetZone zone="top" />
        </Panel>

        <PanelResizeHandle className="h-1 bg-neutral-300 hover:bg-sage-700 transition-colors" />

        {/* Main Content Area */}
        <Panel defaultSize={50} minSize={20}>
          <PanelGroup direction="horizontal" className="h-full">
            {/* Left Zone */}
            <Panel
              defaultSize={isZoneCollapsed('left') ? 5 : layoutConfig.leftZoneSize}
              minSize={5}
              collapsedSize={5}
              collapsible
              collapsed={isZoneCollapsed('left')}
              onResize={(size) => setZoneSize('left', size)}
            >
              <WidgetZone zone="left" />
            </Panel>

            <PanelResizeHandle className="w-1 bg-neutral-300 hover:bg-sage-700 transition-colors" />

            {/* Central Editor */}
            <Panel defaultSize={50} minSize={30}>
              <div className="h-full flex items-center justify-center p-4">
                <RichTextEditor className="w-full h-full shadow-lg" />
              </div>
            </Panel>

            <PanelResizeHandle className="w-1 bg-neutral-300 hover:bg-sage-700 transition-colors" />

            {/* Right Zone */}
            <Panel
              defaultSize={isZoneCollapsed('right') ? 5 : layoutConfig.rightZoneSize}
              minSize={5}
              collapsedSize={5}
              collapsible
              collapsed={isZoneCollapsed('right')}
              onResize={(size) => setZoneSize('right', size)}
            >
              <WidgetZone zone="right" />
            </Panel>
          </PanelGroup>
        </Panel>

        <PanelResizeHandle className="h-1 bg-neutral-300 hover:bg-sage-700 transition-colors" />

        {/* Bottom Zone */}
        <Panel
          defaultSize={isZoneCollapsed('bottom') ? 5 : layoutConfig.bottomZoneSize}
          minSize={5}
          collapsedSize={5}
          collapsible
          collapsed={isZoneCollapsed('bottom')}
          onResize={(size) => setZoneSize('bottom', size)}
        >
          <WidgetZone zone="bottom" />
        </Panel>
      </PanelGroup>
    </div>
  );
};