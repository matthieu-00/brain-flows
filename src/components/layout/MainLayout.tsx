import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { PanelGroup, Panel, PanelResizeHandle, ImperativePanelGroupHandle } from 'react-resizable-panels';
import { useLayoutStore } from '../../store/layoutStore';
import { useAgentStore } from '../../store/agentStore';
import { RichTextEditor } from '../editor/RichTextEditor';
import { WidgetZone } from './WidgetZone';
import { AgentPanel } from '../agent/AgentPanel';
import { getZoneMinimumSizePx } from '../../utils/widgetLayout';

const COLLAPSED_PANEL_PCT = 4;
const CENTER_MIN_HEIGHT_PCT = 20;
const CENTER_MIN_WIDTH_PCT = 25;
// Keep at least 20% of the viewport for the editor vertically and 25% horizontally.
const MAX_VERTICAL_ZONES_PCT = 100 - CENTER_MIN_HEIGHT_PCT; // 80
const MAX_HORIZONTAL_ZONES_PCT = 100 - CENTER_MIN_WIDTH_PCT;  // 75
// Additional guardrails so top/bottom strips never dominate the screen.
const MAX_SINGLE_STRIP_PCT = 35; // hard cap per strip zone

export const MainLayout: React.FC = () => {
  const { distractionFreeMode, layoutConfig, handlePanelResize, getWidgetsByZone, widgets, updateLayoutConfig, isZoneCollapsed } = useLayoutStore();
  const agentPanelSide = useAgentStore((s) => s.agentPanelSide);
  const prevCountByZoneRef = useRef<Record<string, number>>({ top: 0, bottom: 0, left: 0, right: 0 });
  const isFirstLayoutRef = useRef(true);

  const [viewportSize, setViewportSize] = useState({ width: typeof window !== 'undefined' ? window.innerWidth : 1024, height: typeof window !== 'undefined' ? window.innerHeight : 768 });
  useEffect(() => {
    const onResize = () => setViewportSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const zoneMinPct = useMemo(() => {
    const topWidget = getWidgetsByZone('top')[0] ?? null;
    const bottomWidget = getWidgetsByZone('bottom')[0] ?? null;
    const leftWidget = getWidgetsByZone('left')[0] ?? null;
    const rightWidget = getWidgetsByZone('right')[0] ?? null;

    const topPx = getZoneMinimumSizePx('top', topWidget);
    const bottomPx = getZoneMinimumSizePx('bottom', bottomWidget);
    const leftPx = getZoneMinimumSizePx('left', leftWidget);
    const rightPx = getZoneMinimumSizePx('right', rightWidget);

    const h = viewportSize.height;
    const w = viewportSize.width;

    let topPct = h > 0 ? Math.min(MAX_SINGLE_STRIP_PCT, (topPx.minHeightPx / h) * 100) : 0;
    let bottomPct = h > 0 ? Math.min(MAX_SINGLE_STRIP_PCT, (bottomPx.minHeightPx / h) * 100) : 0;
    let leftPct = w > 0 ? Math.min(100, (leftPx.minWidthPx / w) * 100) : 0;
    let rightPct = w > 0 ? Math.min(100, (rightPx.minWidthPx / w) * 100) : 0;

    const verticalSum = topPct + bottomPct;
    if (verticalSum > MAX_VERTICAL_ZONES_PCT && verticalSum > 0) {
      const scale = MAX_VERTICAL_ZONES_PCT / verticalSum;
      topPct *= scale;
      bottomPct *= scale;
    }
    const horizontalSum = leftPct + rightPct;
    if (horizontalSum > MAX_HORIZONTAL_ZONES_PCT && horizontalSum > 0) {
      const scale = MAX_HORIZONTAL_ZONES_PCT / horizontalSum;
      leftPct *= scale;
      rightPct *= scale;
    }

    return {
      top: Math.max(COLLAPSED_PANEL_PCT, topPct),
      bottom: Math.max(COLLAPSED_PANEL_PCT, bottomPct),
      left: Math.max(COLLAPSED_PANEL_PCT, leftPct),
      right: Math.max(COLLAPSED_PANEL_PCT, rightPct),
    };
  }, [getWidgetsByZone, viewportSize, widgets]);

  // Auto-expand panel when a widget is added (0 -> 1) and current size is below the widget's minimum
  useEffect(() => {
    const topN = getWidgetsByZone('top').length;
    const bottomN = getWidgetsByZone('bottom').length;
    const leftN = getWidgetsByZone('left').length;
    const rightN = getWidgetsByZone('right').length;
    const prev = prevCountByZoneRef.current;

    if (isFirstLayoutRef.current) {
      isFirstLayoutRef.current = false;
      prevCountByZoneRef.current = { top: topN, bottom: bottomN, left: leftN, right: rightN };
      return;
    }

    const checkZone = (zone: 'top' | 'bottom' | 'left' | 'right', currentN: number, sizeKey: keyof typeof layoutConfig, minPct: number) => {
      if (prev[zone] === 0 && currentN === 1 && !isZoneCollapsed(zone)) {
        const currentSize = layoutConfig[sizeKey] as number;
        if (typeof currentSize === 'number' && currentSize < minPct) {
          updateLayoutConfig({ [sizeKey]: minPct });
        }
      }
    };

    // For strips, be slightly more conservative when auto-expanding so they stay compact.
    const topTarget = Math.min(zoneMinPct.top, MAX_SINGLE_STRIP_PCT);
    const bottomTarget = Math.min(zoneMinPct.bottom, MAX_SINGLE_STRIP_PCT);

    checkZone('top', topN, 'topZoneHeight', topTarget);
    checkZone('bottom', bottomN, 'bottomZoneHeight', bottomTarget);
    checkZone('left', leftN, 'leftZoneWidth', zoneMinPct.left);
    checkZone('right', rightN, 'rightZoneWidth', zoneMinPct.right);

    prevCountByZoneRef.current = { top: topN, bottom: bottomN, left: leftN, right: rightN };
  }, [widgets, layoutConfig, getWidgetsByZone, isZoneCollapsed, zoneMinPct, updateLayoutConfig]);

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
          minSize={zoneMinPct.top}
          collapsedSize={COLLAPSED_PANEL_PCT}
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
              minSize={zoneMinPct.left}
              collapsedSize={COLLAPSED_PANEL_PCT}
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
              minSize={zoneMinPct.right}
              collapsedSize={COLLAPSED_PANEL_PCT}
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
          minSize={zoneMinPct.bottom}
          collapsedSize={COLLAPSED_PANEL_PCT}
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