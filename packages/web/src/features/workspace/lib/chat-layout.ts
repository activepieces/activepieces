import type { ToasterProps } from 'sonner';

import type { ChatPanelSide } from './chat-panel-open';

function widthFor({
  fullPage,
  open,
  mode,
}: {
  fullPage: boolean;
  open: boolean;
  mode: ChatPanelSide;
}): ChatWidth {
  if (fullPage) {
    return 'full';
  }
  if (!open) {
    return 'closed';
  }
  return mode;
}

function toastPlacementFor(chatWidth: ChatWidth | null): ToastPlacement {
  switch (chatWidth) {
    case 'full':
      return { position: 'top-center', offset: { top: FULL_TOAST_TOP } };
    case 'right':
      return { position: 'bottom-left', offset: undefined };
    default:
      return { position: 'bottom-right', offset: undefined };
  }
}

function dockWidthFor(width: number): number {
  return Math.round(Math.min(Math.max(width, DOCK_MIN_WIDTH), DOCK_MAX_WIDTH));
}

function sidebarWidth(railOpen: boolean): number {
  return (railOpen ? SIDEBAR_WIDTH_REM : RAIL_WIDTH_REM) * rootFontSize();
}

function cardInnerWidth({
  viewportWidth,
  railOpen,
  chrome = CARD_CHROME,
}: {
  viewportWidth: number;
  railOpen: boolean;
  chrome?: number;
}): number {
  return viewportWidth - sidebarWidth(railOpen) - chrome;
}

// The dock never squeezes the page under PAGE_COMFORT_WIDTH, but it never
// gets narrower than DOCK_MIN_WIDTH either.
function shownDockWidth({
  savedWidth,
  cardWidth,
}: {
  savedWidth: number;
  cardWidth: number;
}): number {
  const max = Math.min(DOCK_MAX_WIDTH, cardWidth - PAGE_COMFORT_WIDTH);
  return Math.round(
    Math.min(
      Math.max(savedWidth, DOCK_MIN_WIDTH),
      Math.max(DOCK_MIN_WIDTH, max),
    ),
  );
}

function rootFontSize(): number {
  return parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
}

const DOCK_MIN_WIDTH = 320;
const DOCK_MAX_WIDTH = 640;
const DOCK_DEFAULT_WIDTH = 372;
const PAGE_COMFORT_WIDTH = 760;
const SIDEBAR_WIDTH_REM = 15.5;
const RAIL_WIDTH_REM = 3;
const CARD_CHROME = 10;
const PANEL_ID = 'ap-chat-panel';
const FULL_TOAST_TOP = 80;

export const chatLayoutUtils = {
  widthFor,
  dockWidthFor,
  cardInnerWidth,
  shownDockWidth,
  toastPlacementFor,
  DOCK_MIN_WIDTH,
  DOCK_MAX_WIDTH,
  DOCK_DEFAULT_WIDTH,
  PAGE_COMFORT_WIDTH,
  PANEL_ID,
};

export type ChatWidth = ChatPanelSide | 'full' | 'closed';
export type ToastPlacement = {
  position: NonNullable<ToasterProps['position']>;
  offset: ToasterProps['offset'];
};
