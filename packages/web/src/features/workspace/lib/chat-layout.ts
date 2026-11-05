import { ChatPanelMode } from './chat-panel-open';

// Geometry shared by the sidebar, the docked chat and the floating chat.
export const SIDEBAR_WIDTH_REM = 15.5;
export const RAIL_WIDTH_REM = 3;
export const DOCK_MIN_WIDTH = 320;
export const DOCK_MAX_WIDTH = 640;
// The page keeps at least this much width when it can: the dock gives up
// width first, then the sidebar folds.
export const PAGE_COMFORT_WIDTH = 760;
// Below this a docked panel would crush the page, so it floats instead.
export const DOCK_BREAKPOINT = 960;
// Below this the panel is a full-height sheet. Matches useIsMobile.
export const MOBILE_BREAKPOINT = 768;
// The layout's right gutter (pr-2) plus the card's two borders.
const CARD_CHROME = 10;

export type ChatLayout = 'left' | 'right' | 'float' | 'sheet';

export function chatLayoutFor(
  mode: ChatPanelMode,
  viewportWidth: number,
): ChatLayout {
  if (viewportWidth < MOBILE_BREAKPOINT) {
    return 'sheet';
  }
  if (mode === 'float' || viewportWidth < DOCK_BREAKPOINT) {
    return 'float';
  }
  return mode;
}

export function sidebarWidth(railOpen: boolean): number {
  return (railOpen ? SIDEBAR_WIDTH_REM : RAIL_WIDTH_REM) * rootFontSize();
}

// The width inside the page card, which the dock and the page share.
export function cardInnerWidth(viewportWidth: number, railOpen: boolean) {
  return viewportWidth - sidebarWidth(railOpen) - CARD_CHROME;
}

export function dockWidthFor(savedWidth: number, cardWidth: number): number {
  return clamp(
    savedWidth,
    DOCK_MIN_WIDTH,
    Math.min(DOCK_MAX_WIDTH, cardWidth - PAGE_COMFORT_WIDTH),
  );
}

// True when even a minimum-width dock leaves the page cramped.
export function dockCrampsPage(viewportWidth: number, railOpen: boolean) {
  return (
    cardInnerWidth(viewportWidth, railOpen) - DOCK_MIN_WIDTH <
    PAGE_COMFORT_WIDTH
  );
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), Math.max(min, max));
}

function rootFontSize(): number {
  return parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
}
