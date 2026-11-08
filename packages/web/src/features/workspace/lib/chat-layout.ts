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

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), Math.max(min, max));
}

// The sidebar, the docked slot and the page move together, so they share one
// duration, set by whichever move starts them: things arriving take longer
// than things leaving. A move that is retargeted mid-way keeps its curve.
const MOVE_MS = { enter: 220, exit: 160 } as const;
export function startStructuralMove(kind: keyof typeof MOVE_MS) {
  document.documentElement.style.setProperty('--ap-move', `${MOVE_MS[kind]}ms`);
}

// Read on every pointer move during a drag, so it's cached: getComputedStyle
// there would force a style pass per event.
let fontSize: number | null = null;
function rootFontSize(): number {
  if (fontSize === null) {
    fontSize =
      parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
  }
  return fontSize;
}
if (typeof window !== 'undefined') {
  window.addEventListener('resize', () => {
    fontSize = null;
  });
}
