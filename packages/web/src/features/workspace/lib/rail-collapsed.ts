import { matchPath } from 'react-router-dom';
import { create } from 'zustand';

import { routesThatRequireProjectId } from '@/lib/route-utils';

const STORAGE_KEY = 'primary-rail-collapsed';

// Inside one agent the rail is furniture: the page has its own header, its own
// conversation list and its own panel. The route only asks for it closed, so an
// explicit click on that page still wins until you navigate on.
const ROUTES_THAT_HOLD_THE_RAIL_CLOSED = [
  routesThatRequireProjectId.singleAgent,
  `/projects/:projectId${routesThatRequireProjectId.singleAgent}`,
];

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
