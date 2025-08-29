import React from 'react';
import { motion } from 'framer-motion';
import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels';
import { useLayoutStore } from '../../store/layoutStore';
import { RichTextEditor } from '../editor/RichTextEditor';
import { WidgetZone } from './WidgetZone';

export const MainLayout: React.FC = () => {
  const { distractionFreeMode, layoutConfig, setZoneSize, toggleZoneCollapsed } = useLayoutStore();

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
          defaultSize={layoutConfig.topZoneSize}
          minSize={5}
          collapsedSize={layoutConfig.topZoneCollapsedSize}
          collapsible
          onResize={(size) => setZoneSize('top', size)}
          onCollapse={() => toggleZoneCollapsed('top')}
          onExpand={() => toggleZoneCollapsed('top')}
        >
          <WidgetZone zone="top" />
        </Panel>

        <PanelResizeHandle className="h-1 bg-neutral-300 hover:bg-sage-700 transition-colors" />

        {/* Main Content Area */}
        <Panel defaultSize={50} minSize={20}>
          <PanelGroup direction="horizontal" className="h-full">
            {/* Left Zone */}
            <Panel
              defaultSize={layoutConfig.leftZoneSize}
              minSize={5}
              collapsedSize={layoutConfig.leftZoneCollapsedSize}
              collapsible
              onResize={(size) => setZoneSize('left', size)}
              onCollapse={() => toggleZoneCollapsed('left')}
              onExpand={() => toggleZoneCollapsed('left')}
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
              defaultSize={layoutConfig.rightZoneSize}
              minSize={5}
              collapsedSize={layoutConfig.rightZoneCollapsedSize}
              collapsible
              onResize={(size) => setZoneSize('right', size)}
              onCollapse={() => toggleZoneCollapsed('right')}
              onExpand={() => toggleZoneCollapsed('right')}
            >
              <WidgetZone zone="right" />
            </Panel>
          </PanelGroup>
        </Panel>

        <PanelResizeHandle className="h-1 bg-neutral-300 hover:bg-sage-700 transition-colors" />

        {/* Bottom Zone */}
        <Panel
          defaultSize={layoutConfig.bottomZoneSize}
          minSize={5}
          collapsedSize={layoutConfig.bottomZoneCollapsedSize}
          collapsible
          onResize={(size) => setZoneSize('bottom', size)}
          onCollapse={() => toggleZoneCollapsed('bottom')}
          onExpand={() => toggleZoneCollapsed('bottom')}
        >
          <WidgetZone zone="bottom" />
        </Panel>
      </PanelGroup>
    </div>
  );
};