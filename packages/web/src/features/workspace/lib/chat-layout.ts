import { ChatPanelMode } from './chat-panel-open';

export const SIDEBAR_WIDTH_REM = 15.5;
export const RAIL_WIDTH_REM = 3;
export const DOCK_MIN_WIDTH = 320;
export const DOCK_MAX_WIDTH = 640;
export const PAGE_COMFORT_WIDTH = 760;
export const DOCK_BREAKPOINT = 960;
export const MOBILE_BREAKPOINT = 768;
const CARD_CHROME = 10;

export type ChatLayout = 'left' | 'right' | 'float' | 'sheet';
export type ChatWidth = ChatLayout | 'full' | 'closed';

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

export function chatWidthFor({
  fullPage,
  open,
  mode,
  split,
  viewportWidth,
}: {
  fullPage: boolean;
  open: boolean;
  mode: ChatPanelMode;
  split: boolean;
  viewportWidth: number;
}): ChatWidth {
  if (fullPage) {
    return 'full';
  }
  if (!open) {
    return 'closed';
  }
  if (split && viewportWidth >= MOBILE_BREAKPOINT) {
    return viewportWidth >= DOCK_BREAKPOINT ? 'left' : 'float';
  }
  return chatLayoutFor(mode, viewportWidth);
}

export function sidebarWidth(railOpen: boolean): number {
  return (railOpen ? SIDEBAR_WIDTH_REM : RAIL_WIDTH_REM) * rootFontSize();
}

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

const MOVE_MS = { enter: 220, exit: 160, fold: 160 } as const;
export function startStructuralMove(kind: keyof typeof MOVE_MS) {
  document.documentElement.style.setProperty('--ap-move', `${MOVE_MS[kind]}ms`);
}

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
