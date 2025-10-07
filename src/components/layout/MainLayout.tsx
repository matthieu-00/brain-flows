import React from 'react';
import { motion } from 'framer-motion';
import { PanelGroup, Panel, PanelResizeHandle, ImperativePanelGroupHandle } from 'react-resizable-panels';
import { useLayoutStore } from '../../store/layoutStore';
import { RichTextEditor } from '../editor/RichTextEditor';
import { WidgetZone } from './WidgetZone';

export const MainLayout: React.FC = () => {
  const { distractionFreeMode, layoutConfig, updateLayoutConfig } = useLayoutStore();
  
  // Refs for PanelGroups to control collapsing
  const verticalGroupRef = React.useRef<ImperativePanelGroupHandle>(null);
  const horizontalGroupRef = React.useRef<ImperativePanelGroupHandle>(null);

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
      <PanelGroup direction="vertical" className="min-h-screen" ref={verticalGroupRef}>
        {/* Top Zone */}
        <Panel
          id="top-panel"
          size={layoutConfig.topZoneHeight}
          minSize={1}
          collapsedSize={1}
          collapsible
          onResize={(size) => {
            updateLayoutConfig({ topZoneHeight: size });
          }}
        >
          <WidgetZone zone="top" panelGroupRef={verticalGroupRef} panelId="top-panel" />
        </Panel>

        <PanelResizeHandle className="h-1 bg-neutral-300 hover:bg-sage-700 transition-colors" />

        {/* Main Content Area */}
        <Panel defaultSize={50} minSize={20}>
          <PanelGroup direction="horizontal" className="h-full" ref={horizontalGroupRef}>
            {/* Left Zone */}
            <Panel
              id="left-panel"
              size={layoutConfig.leftZoneWidth}
              minSize={1}
              collapsedSize={1}
              collapsible
              onResize={(size) => {
                updateLayoutConfig({ leftZoneWidth: size });
              }}
            >
              <WidgetZone zone="left" panelGroupRef={horizontalGroupRef} panelId="left-panel" />
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
              id="right-panel"
              size={layoutConfig.rightZoneWidth}
              minSize={1}
              collapsedSize={1}
              collapsible
              onResize={(size) => {
                updateLayoutConfig({ rightZoneWidth: size });
              }}
            >
              <WidgetZone zone="right" panelGroupRef={horizontalGroupRef} panelId="right-panel" />
            </Panel>
          </PanelGroup>
        </Panel>

        <PanelResizeHandle className="h-1 bg-neutral-300 hover:bg-sage-700 transition-colors" />

        {/* Bottom Zone */}
        <Panel
          id="bottom-panel"
          size={layoutConfig.bottomZoneHeight}
          minSize={1}
          collapsedSize={1}
          collapsible
          onResize={(size) => {
            updateLayoutConfig({ bottomZoneHeight: size });
          }}
        >
          <WidgetZone zone="bottom" panelGroupRef={verticalGroupRef} panelId="bottom-panel" />
        </Panel>
      </PanelGroup>
    </div>
  );
};