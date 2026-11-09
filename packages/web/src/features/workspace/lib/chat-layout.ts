import type { ToasterProps } from 'sonner';

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
  if (!open) {
    return 'closed';
  }
  return viewportWidth < MOBILE_BREAKPOINT ? 'sheet' : mode;
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

// Rail and dock share one duration per move, so they land together.
function startStructuralMove(kind: 'enter' | 'exit' | 'fold') {
  document.documentElement.style.setProperty('--ap-move', `${MOVE_MS[kind]}ms`);
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
  emphasized: 'cubic-bezier(0.05, 0.7, 0.1, 1)',
  standard: 'cubic-bezier(0.2, 0, 0, 1)',
} as const;
const PANEL_ID = 'ap-chat-panel';
const FULL_TOAST_TOP = 80;

export const chatLayoutUtils = {
  widthFor,
  dockWidthFor,
  cardInnerWidth,
  shownDockWidth,
  startStructuralMove,
  prefersReducedMotion,
  toastPlacementFor,
  DOCK_MIN_WIDTH,
  DOCK_MAX_WIDTH,
  DOCK_DEFAULT_WIDTH,
  PAGE_COMFORT_WIDTH,
  MOBILE_BREAKPOINT,
  PANEL_ID,
  MOVE_MS,
  MOVE_EASE,
};

export type ChatWidth = ChatPanelSide | 'sheet' | 'full' | 'closed';
export type ToastPlacement = {
  position: NonNullable<ToasterProps['position']>;
  offset: ToasterProps['offset'];
};
