import { MOBILE_BREAKPOINT } from '@/hooks/use-mobile';

import type { ChatPanelSide } from './chat-panel-open';

function widthFor({
  fullPage,
  open,
  mode,
  viewportWidth,
}: {
  fullPage: boolean;
  open: boolean;
  mode: ChatPanelSide;
  viewportWidth: number;
}): ChatWidth {
  if (fullPage) {
    return 'full';
  }
  if (!open || viewportWidth < MOBILE_BREAKPOINT) {
    return 'closed';
  }
  return mode;
}

function dockWidthFor(width: number): number {
  return Math.round(Math.min(Math.max(width, DOCK_MIN_WIDTH), DOCK_MAX_WIDTH));
}

const DOCK_MIN_WIDTH = 320;
const DOCK_MAX_WIDTH = 640;
const DOCK_DEFAULT_WIDTH = 372;
const PAGE_COMFORT_WIDTH = 560;

export const chatLayoutUtils = {
  widthFor,
  dockWidthFor,
  DOCK_MIN_WIDTH,
  DOCK_MAX_WIDTH,
  DOCK_DEFAULT_WIDTH,
  PAGE_COMFORT_WIDTH,
  MOBILE_BREAKPOINT,
};

export type ChatWidth = ChatPanelSide | 'full' | 'closed';
