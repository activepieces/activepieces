import { matchPath, useLocation } from 'react-router-dom';
import { create } from 'zustand';

import { routesThatRequireProjectId } from '@/lib/route-utils';

const STORAGE_KEY = 'primary-rail-collapsed';

// Inside one agent the rail is furniture: the page has its own header, its own
// conversation list and its own panel, and there is nowhere left for it to go.
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

export function useRailIsCollapsed(): boolean {
  const { pathname } = useLocation();
  const preference = useRailCollapsed((state) => state.preference);
  const heldClosed = ROUTES_THAT_HOLD_THE_RAIL_CLOSED.some(
    (route) => matchPath(route, pathname) !== null,
  );
  return preference || heldClosed;
}

type RailCollapsedState = {
  preference: boolean;
  setCollapsed: (value: boolean) => void;
  toggle: () => void;
};
