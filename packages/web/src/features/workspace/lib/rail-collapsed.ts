import { useCallback } from 'react';
import { matchPath, useLocation, useMatches } from 'react-router-dom';
import { create } from 'zustand';

import { routesThatRequireProjectId } from '@/lib/route-utils';

import { chatLayoutUtils } from './chat-layout';
import { useChatPanel } from './chat-panel-open';
import { windowSizeHooks } from './window-size-hooks';

const STORAGE_KEY = 'primary-rail-collapsed';
const FOLD_BELOW = 960;

// Inside one agent the rail is furniture: the page has its own header, its own
// conversation list and its own panel. The route only asks for it closed, so an
// explicit click on that page still wins until you navigate on.
const AGENT_ROUTES = [
  routesThatRequireProjectId.singleAgent,
  routesThatRequireProjectId.singleAgentRuns,
];

const ROUTES_THAT_HOLD_THE_RAIL_CLOSED = AGENT_ROUTES.flatMap((route) => [
  route,
  `/projects/:projectId${route}`,
]);

function readInitial(): boolean {
  return localStorage.getItem(STORAGE_KEY) === 'true';
}

function persist(value: boolean): boolean {
  localStorage.setItem(STORAGE_KEY, String(value));
  return value;
}

const useRailCollapsed = create<RailCollapsedState>((set) => ({
  preference: readInitial(),
  openedOn: null,
  setCollapsed: ({ collapsed, pathname }) =>
    set({ preference: persist(collapsed), openedOn: pathname }),
}));

export function useRailOpenState() {
  const { open, setCollapsed } = useRailState();
  const onOpenChange = useCallback(
    (next: boolean) => setCollapsed(!next),
    [setCollapsed],
  );
  return { open, onOpenChange };
}

function useRailState() {
  const { preference, openedOn, setCollapsed } = useRailCollapsed();
  const { pathname } = useLocation();
  const chatPage = useMatches().some(({ handle }) => isChatPageHandle(handle));
  const chatOpen = useChatPanel((s) => s.open);
  const viewportWidth = windowSizeHooks.useWidth();
  const open = railIsOpen({
    preference,
    pathname,
    openedOn,
    chatDocked: chatOpen && !chatPage,
    viewportWidth,
  });

  const choose = useCallback(
    (collapsed: boolean) => setCollapsed({ collapsed, pathname }),
    [pathname, setCollapsed],
  );

  return { open, setCollapsed: choose };
}

function railIsOpen({
  preference,
  pathname,
  openedOn,
  chatDocked,
  viewportWidth,
}: RailInputs): boolean {
  if (preference) return false;
  if (openedOn === pathname) return true;
  const routeHoldsItClosed = ROUTES_THAT_HOLD_THE_RAIL_CLOSED.some(
    (route) => matchPath(route, pathname) !== null,
  );
  const chatFoldsIt =
    chatDocked &&
    viewportWidth >= chatLayoutUtils.MOBILE_BREAKPOINT &&
    viewportWidth < FOLD_BELOW;
  return !routeHoldsItClosed && !chatFoldsIt;
}

function isChatPageHandle(handle: unknown): boolean {
  return (
    typeof handle === 'object' &&
    handle !== null &&
    'chat' in handle &&
    handle.chat === 'full'
  );
}

type RailCollapsedState = {
  preference: boolean;
  openedOn: string | null;
  setCollapsed: (params: { collapsed: boolean; pathname: string }) => void;
};

type RailInputs = {
  preference: boolean;
  pathname: string;
  openedOn: string | null;
  chatDocked: boolean;
  viewportWidth: number;
};

export const railUtils = { railIsOpen };
