import type { Widget, WidgetZone } from '../types';
import { getWidgetSizingSpec } from '../constants/widgets';

const WIDGET_HEADER_HEIGHT_PX = 60;
const WIDGET_COLLAPSED_HEIGHT_PX = 60;

export interface ZoneMinimumPx {
  minWidthPx: number;
  minHeightPx: number;
}

/**
 * Returns the minimum size in pixels for a zone that has at most one widget.
 * Used to compute panel minSize (as % of viewport) so the panel cannot be shrunk below the widget's needs.
 */
export function getZoneMinimumSizePx(zone: WidgetZone, widget: Widget | null): ZoneMinimumPx {
  if (!widget) {
    return { minWidthPx: 0, minHeightPx: 0 };
  }

  const spec = getWidgetSizingSpec(widget.type);
  const minWidthPx = spec.minWidth ?? 260;

  // Use more compact, strip-specific heights for top/bottom when available.
  const baseMinHeight = spec.minHeight ?? 200;
  const stripMinHeight =
    zone === 'top'
      ? spec.minHeightTop ?? baseMinHeight
      : zone === 'bottom'
        ? spec.minHeightBottom ?? baseMinHeight
        : baseMinHeight;

  const contentMinHeight = stripMinHeight + WIDGET_HEADER_HEIGHT_PX;

  const effectiveMinHeight = widget.isCollapsed
    ? WIDGET_COLLAPSED_HEIGHT_PX
    : contentMinHeight;

  return {
    minWidthPx,
    minHeightPx: effectiveMinHeight,
  };
}
