import React from 'react';
import { motion } from 'framer-motion';
import { PanelGroup, Panel, PanelResizeHandle, ImperativePanelGroupHandle } from 'react-resizable-panels';
import { useLayoutStore } from '../../store/layoutStore';
import { useAgentStore } from '../../store/agentStore';
import { RichTextEditor } from '../editor/RichTextEditor';
import { WidgetZone } from './WidgetZone';
import { AgentPanel } from '../agent/AgentPanel';

export const MainLayout: React.FC = () => {
  const { distractionFreeMode, layoutConfig, handlePanelResize } = useLayoutStore();
  const agentPanelSide = useAgentStore((s) => s.agentPanelSide);

  // Refs for PanelGroups to control collapsing
  const verticalGroupRef = React.useRef<ImperativePanelGroupHandle>(null);
  const horizontalGroupRef = React.useRef<ImperativePanelGroupHandle>(null);

  if (distractionFreeMode) {
    return (
      <div className="min-h-screen bg-cream-50 dark:bg-neutral-950 flex items-center justify-center p-8">
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
    <div className="min-h-screen bg-cream-100 dark:bg-neutral-950">
      <PanelGroup direction="vertical" className="min-h-screen" ref={verticalGroupRef}>
        {/* Top Zone */}
        <Panel
          id="top-panel"
          className="relative z-20"
          size={layoutConfig.topZoneHeight}
          minSize={3}
          collapsedSize={3}
          collapsible
          onResize={(size) => {
            handlePanelResize('top', size);
          }}
        >
          <WidgetZone zone="top" panelGroupRef={verticalGroupRef} />
        </Panel>

        <PanelResizeHandle className="h-1 bg-neutral-300 dark:bg-neutral-700 hover:bg-sage-700 transition-colors" />

        {/* Main Content Area */}
        <Panel defaultSize={50} minSize={20}>
          <PanelGroup direction="horizontal" className="h-full" ref={horizontalGroupRef}>
            {/* Left Zone */}
            <Panel
              id="left-panel"
              className="relative z-20"
              size={layoutConfig.leftZoneWidth}
              minSize={3}
              collapsedSize={3}
              collapsible
              onResize={(size) => {
                handlePanelResize('left', size);
              }}
            >
              {agentPanelSide === 'left' ? (
                <AgentPanel zone="left" panelGroupRef={horizontalGroupRef} />
              ) : (
                <WidgetZone zone="left" panelGroupRef={horizontalGroupRef} />
              )}
            </Panel>

            <PanelResizeHandle className="w-1 bg-neutral-300 dark:bg-neutral-700 hover:bg-sage-700 transition-colors" />

            {/* Central Editor - z-30 so editor options dropdown appears above side panels (z-20) */}
            <Panel defaultSize={50} minSize={25} className="relative z-30">
              <div className="h-full flex flex-col min-h-0 p-2 sm:p-4 min-w-0">
                <RichTextEditor className="flex-1 min-h-0 w-full shadow-lg" />
              </div>
            </Panel>

            <PanelResizeHandle className="w-1 bg-neutral-300 dark:bg-neutral-700 hover:bg-sage-700 transition-colors" />

            {/* Right Zone */}
            <Panel
              id="right-panel"
              className="relative z-20"
              size={layoutConfig.rightZoneWidth}
              minSize={3}
              collapsedSize={3}
              collapsible
              onResize={(size) => {
                handlePanelResize('right', size);
              }}
            >
              {agentPanelSide === 'right' ? (
                <AgentPanel zone="right" panelGroupRef={horizontalGroupRef} />
              ) : (
                <WidgetZone zone="right" panelGroupRef={horizontalGroupRef} />
              )}
            </Panel>
          </PanelGroup>
        </Panel>

        <PanelResizeHandle className="h-1 bg-neutral-300 dark:bg-neutral-700 hover:bg-sage-700 transition-colors" />

        {/* Bottom Zone */}
        <Panel
          id="bottom-panel"
          className="relative z-20"
          size={layoutConfig.bottomZoneHeight}
          minSize={3}
          collapsedSize={3}
          collapsible
          onResize={(size) => {
            handlePanelResize('bottom', size);
          }}
        >
          <WidgetZone zone="bottom" panelGroupRef={verticalGroupRef} />
        </Panel>
      </PanelGroup>
    </div>
  );
};