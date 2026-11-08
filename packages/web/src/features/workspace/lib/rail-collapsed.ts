import { useCallback, useState } from 'react';
import { matchPath, useLocation } from 'react-router-dom';
import { create } from 'zustand';

import { CHAT_ROUTE, routesThatRequireProjectId } from '@/lib/route-utils';

import { chatPanelIsDocked, useChatPanel } from './chat-panel-open';

const STORAGE_KEY = 'primary-rail-collapsed';

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
  setCollapsed: (value) => set({ preference: persist(value) }),
}));

export function useRailOpenState() {
  const { preference, setCollapsed } = useRailCollapsed();
  const { pathname } = useLocation();
  const [openedOn, setOpenedOn] = useState<string | null>(null);
  // A docked chat panel takes room from the page, so the rail folds for it.
  const chatDocked =
    useChatPanel(chatPanelIsDocked) && !pathname.includes(CHAT_ROUTE);
  const collapsed =
    chatDocked || railIsCollapsed({ preference, pathname, openedOn });

  const onOpenChange = useCallback(
    (open: boolean) => {
      if (open && chatDocked) {
        useChatPanel.getState().setOpen(false);
      }
      setOpenedOn(pathname);
      setCollapsed(!open);
    },
    [pathname, setCollapsed, chatDocked],
  );

  return { open: !collapsed, onOpenChange };
}

function railIsCollapsed({
  preference,
  pathname,
  openedOn,
}: {
  preference: boolean;
  pathname: string;
  openedOn: string | null;
}): boolean {
  const routeHoldsItClosed =
    openedOn !== pathname &&
    ROUTES_THAT_HOLD_THE_RAIL_CLOSED.some(
      (route) => matchPath(route, pathname) !== null,
    );
  return preference || routeHoldsItClosed;
}

type RailCollapsedState = {
  preference: boolean;
  setCollapsed: (value: boolean) => void;
};
