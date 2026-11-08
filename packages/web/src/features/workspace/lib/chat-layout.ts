import { MOBILE_BREAKPOINT } from '@/hooks/use-mobile';

import type { ChatPanelSide } from './chat-panel-open';

function widthFor({
  fullPage,
  open,
  mode,
  split,
  viewportWidth,
}: {
  fullPage: boolean;
  open: boolean;
  mode: ChatPanelSide;
  split: boolean;
  viewportWidth: number;
}): ChatWidth {
  if (fullPage) {
    return 'full';
  }
  if (!open) {
    return 'closed';
  }
  if (viewportWidth < MOBILE_BREAKPOINT) {
    return 'sheet';
  }
  return split ? 'left' : mode;
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

function rootFontSize(): number {
  return parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
}

const SIDEBAR_WIDTH_REM = 15.5;
const RAIL_WIDTH_REM = 3;
const DOCK_MIN_WIDTH = 320;
const DOCK_MAX_WIDTH = 640;
const DOCK_DEFAULT_WIDTH = 372;
const PAGE_COMFORT_WIDTH = 760;
const CARD_CHROME = 10;
const CARD_ID = 'dashboard-content-container';
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
  widthFor,
  cardInnerWidth,
  dockWidthFor,
  clamp,
  startStructuralMove,
  prefersReducedMotion,
  SIDEBAR_WIDTH_REM,
  RAIL_WIDTH_REM,
  DOCK_MIN_WIDTH,
  DOCK_MAX_WIDTH,
  DOCK_DEFAULT_WIDTH,
  PAGE_COMFORT_WIDTH,
  MOBILE_BREAKPOINT,
  CARD_ID,
  MOVE_MS,
  MOVE_EASE,
};

export type ChatWidth = ChatPanelSide | 'sheet' | 'full' | 'closed';
