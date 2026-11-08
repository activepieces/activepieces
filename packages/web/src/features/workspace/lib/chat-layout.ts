import type {
  ChatPanelMode,
  FloatPosition,
  FloatSize,
} from './chat-panel-open';

function layoutFor({
  mode,
  viewportWidth,
}: {
  mode: ChatPanelMode;
  viewportWidth: number;
}): ChatLayout {
  if (viewportWidth < MOBILE_BREAKPOINT) {
    return 'sheet';
  }
  if (mode === 'float' || viewportWidth < DOCK_BREAKPOINT) {
    return 'float';
  }
  return mode;
}

function widthFor({
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
  return layoutFor({ mode, viewportWidth });
}

function sidebarWidth(railOpen: boolean): number {
  return (railOpen ? SIDEBAR_WIDTH_REM : RAIL_WIDTH_REM) * rootFontSize();
}

function cardInnerWidth({
  viewportWidth,
  railOpen,
}: {
  viewportWidth: number;
  railOpen: boolean;
}): number {
  return viewportWidth - sidebarWidth(railOpen) - CARD_CHROME;
}

function dockWidthFor({
  savedWidth,
  cardWidth,
}: {
  savedWidth: number;
  cardWidth: number;
}): number {
  return clamp({
    value: savedWidth,
    min: DOCK_MIN_WIDTH,
    max: Math.min(DOCK_MAX_WIDTH, cardWidth - PAGE_COMFORT_WIDTH),
  });
}

function clamp({
  value,
  min,
  max,
}: {
  value: number;
  min: number;
  max: number;
}): number {
  return Math.min(Math.max(value, min), Math.max(min, max));
}

function startStructuralMove(kind: 'enter' | 'exit' | 'fold') {
  document.documentElement.style.setProperty('--ap-move', `${MOVE_MS[kind]}ms`);
}

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function cardRect(): DOMRect | null {
  return document.getElementById(CARD_ID)?.getBoundingClientRect() ?? null;
}

function fitToWindow(size: FloatSize): FloatSize {
  return {
    width: clamp({
      value: size.width,
      min: FLOAT_MIN.width,
      max: window.innerWidth - EDGE * 2,
    }),
    height: clamp({
      value: size.height,
      min: FLOAT_MIN.height,
      max: window.innerHeight - EDGE * 2,
    }),
  };
}

function clampToWindow({
  position,
  size,
}: {
  position: FloatPosition;
  size: FloatSize;
}): FloatPosition {
  return {
    x: clamp({
      value: position.x,
      min: EDGE,
      max: window.innerWidth - size.width - EDGE,
    }),
    y: clamp({
      value: position.y,
      min: EDGE,
      max: window.innerHeight - size.height - EDGE,
    }),
  };
}

function defaultFloat(size: FloatSize): FloatPosition {
  const card = cardRect();
  return {
    x: (card?.left ?? EDGE) + 24,
    y: window.innerHeight - size.height - 24,
  };
}

function rootFontSize(): number {
  return parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
}

const SIDEBAR_WIDTH_REM = 15.5;
const RAIL_WIDTH_REM = 3;
const DOCK_MIN_WIDTH = 320;
const DOCK_MAX_WIDTH = 640;
const DOCK_DEFAULT_WIDTH = 372;
const PAGE_COMFORT_WIDTH = 760;
const DOCK_BREAKPOINT = 960;
const MOBILE_BREAKPOINT = 768;
const CARD_CHROME = 10;
const CARD_ID = 'dashboard-content-container';
const EDGE = 16;
const FLOAT_DEFAULT: FloatSize = { width: 400, height: 640 };
const FLOAT_MIN: FloatSize = { width: 320, height: 400 };
const MOVE_MS = {
  enter: 220,
  exit: 160,
  fold: 160,
  wide: 320,
  back: 260,
  edgeDelay: 120,
  settleSlack: 160,
} as const;
const MOVE_EASE = {
  out: [0.22, 1, 0.36, 1],
  emphasized: 'cubic-bezier(0.05, 0.7, 0.1, 1)',
  standard: 'cubic-bezier(0.2, 0, 0, 1)',
} as const;

export const chatLayoutUtils = {
  layoutFor,
  widthFor,
  sidebarWidth,
  cardInnerWidth,
  dockWidthFor,
  clamp,
  startStructuralMove,
  prefersReducedMotion,
  cardRect,
  fitToWindow,
  clampToWindow,
  defaultFloat,
  SIDEBAR_WIDTH_REM,
  RAIL_WIDTH_REM,
  DOCK_MIN_WIDTH,
  DOCK_MAX_WIDTH,
  DOCK_DEFAULT_WIDTH,
  PAGE_COMFORT_WIDTH,
  DOCK_BREAKPOINT,
  MOBILE_BREAKPOINT,
  CARD_ID,
  EDGE,
  FLOAT_DEFAULT,
  FLOAT_MIN,
  MOVE_MS,
  MOVE_EASE,
};

export type ChatLayout = 'left' | 'right' | 'float' | 'sheet';
export type ChatWidth = ChatLayout | 'full' | 'closed';
