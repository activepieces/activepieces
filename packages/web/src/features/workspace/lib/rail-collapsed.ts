import { useState } from 'react';
import { matchPath, useLocation } from 'react-router-dom';
import { create } from 'zustand';

import { routesThatRequireProjectId } from '@/lib/route-utils';

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

export const useRailCollapsed = create<RailCollapsedState>((set) => ({
  preference: readInitial(),
  setCollapsed: (value) => set({ preference: persist(value) }),
  toggle: () => set((state) => ({ preference: persist(!state.preference) })),
}));

export function useRailOpenState() {
  const { preference, setCollapsed } = useRailCollapsed();
  const { pathname } = useLocation();
  const [openedOn, setOpenedOn] = useState<string | null>(null);
  const collapsed = railIsCollapsed({ preference, pathname, openedOn });

  const onOpenChange = (open: boolean) => {
    setOpenedOn(pathname);
    setCollapsed(!open);
  };

  return { open: !collapsed, onOpenChange };
}

export function railIsCollapsed({
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
  toggle: () => void;
};
