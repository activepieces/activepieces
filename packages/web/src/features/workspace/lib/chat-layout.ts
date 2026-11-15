import type { ToasterProps } from 'sonner';

import type { ChatPanelSide } from './chat-panel-open';

function widthFor({
  fullPage,
  open,
  mode,
  phone,
}: {
  fullPage: boolean;
  open: boolean;
  mode: ChatPanelSide;
  phone: boolean;
}): ChatWidth {
  if (fullPage) {
    return 'full';
  }
  if (!open) {
    return 'closed';
  }
  return phone ? 'sheet' : mode;
}

function toastPlacementFor(chatWidth: ChatWidth | null): ToastPlacement {
  switch (chatWidth) {
    case 'full':
      return { position: 'top-center', offset: { top: FULL_TOAST_TOP } };
    case 'sheet':
      return { position: 'top-center', offset: undefined };
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

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
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

const EASE_OUT: CubicBezier = [0.23, 1, 0.32, 1];
const EASE_DRAWER: CubicBezier = [0.32, 0.72, 0, 1];

const MOTION = {
  easeOut: EASE_OUT,
  easeOutCss: cssBezier(EASE_OUT),
  easeDrawerCss: cssBezier(EASE_DRAWER),
  micro: 0.1,
  fast: 0.12,
  base: 0.16,
  move: 0.2,
  sheet: 0.26,
  highlightMax: 0.6,
};

function cssBezier([x1, y1, x2, y2]: CubicBezier): string {
  return `cubic-bezier(${x1}, ${y1}, ${x2}, ${y2})`;
}

function motionCssVars(): Record<string, string> {
  const ms = (seconds: number) => `${Math.round(seconds * 1000)}ms`;
  return {
    '--ease-ap-out': MOTION.easeOutCss,
    '--ease-ap-drawer': MOTION.easeDrawerCss,
    '--dur-micro': ms(MOTION.micro),
    '--dur-fast': ms(MOTION.fast),
    '--dur-base': ms(MOTION.base),
    '--dur-move': ms(MOTION.move),
    '--dur-sheet': ms(MOTION.sheet),
  };
}

function applyMotionVars({ root }: { root: HTMLElement }): void {
  for (const [name, value] of Object.entries(motionCssVars())) {
    root.style.setProperty(name, value);
  }
}

const chatLayoutUtils = {
  widthFor,
  dockWidthFor,
  cardInnerWidth,
  shownDockWidth,
  prefersReducedMotion,
  toastPlacementFor,
  motionCssVars,
  applyMotionVars,
  DOCK_MIN_WIDTH,
  DOCK_MAX_WIDTH,
  DOCK_DEFAULT_WIDTH,
  PANEL_ID,
};

export { chatLayoutUtils, MOTION };

type CubicBezier = [number, number, number, number];

export type ChatWidth = ChatPanelSide | 'sheet' | 'full' | 'closed';
type ToastPlacement = {
  position: NonNullable<ToasterProps['position']>;
  offset: ToasterProps['offset'];
};
