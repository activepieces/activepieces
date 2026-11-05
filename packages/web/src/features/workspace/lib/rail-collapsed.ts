import { useCallback } from 'react';
import { matchPath, useLocation } from 'react-router-dom';
import { create } from 'zustand';

import { CHAT_ROUTE, routesThatRequireProjectId } from '@/lib/route-utils';

import { DOCK_BREAKPOINT, startStructuralMove } from './chat-layout';
import { chatPanelIsDocked, useChatPanel } from './chat-panel-open';

const PREFERENCE_KEY = 'primary-rail-collapsed';
// Set while the rail is folded only to make room for the docked chat, so
// closing the chat gives the sidebar back. Survives a reload, like the chat.
const FOLDED_FOR_CHAT_KEY = 'primary-rail-folded-for-chat';

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

const useRail = create<RailState>(() => ({
  preference: readFlag(localStorage, PREFERENCE_KEY),
  foldedForChat: readFlag(localStorage, FOLDED_FOR_CHAT_KEY),
  openedOn: null,
}));

function update(patch: Partial<RailState>) {
  useRail.setState(patch);
  const state = useRail.getState();
  writeFlag(localStorage, PREFERENCE_KEY, state.preference);
  writeFlag(localStorage, FOLDED_FOR_CHAT_KEY, state.foldedForChat);
}

function railIsOpen(state: RailState, pathname: string): boolean {
  const routeHoldsItClosed =
    state.openedOn !== pathname &&
    ROUTES_THAT_HOLD_THE_RAIL_CLOSED.some(
      (route) => matchPath(route, pathname) !== null,
    );
  // The chat page hides the panel, so it has no reason to hold the rail.
  const chatHoldsItClosed =
    state.foldedForChat && !pathname.includes(CHAT_ROUTE);
  return !(state.preference || routeHoldsItClosed || chatHoldsItClosed);
}

export function useRailOpen(): boolean {
  const { pathname } = useLocation();
  return useRail((state) => railIsOpen(state, pathname));
}

export function useRailOpenState() {
  const open = useRailOpen();
  const { pathname } = useLocation();

  const onOpenChange = useCallback(
    (next: boolean) => {
      startStructuralMove(next ? 'enter' : 'exit');
      // A choice made while docked stands until the chat docks again.
      update({ preference: !next, foldedForChat: false, openedOn: pathname });
    },
    [pathname],
  );

  return { open, onOpenChange };
}

export function railOpenNow(): boolean {
  return railIsOpen(useRail.getState(), window.location.pathname);
}

// Docking the chat always folds the rail, in step with the dock opening: on
// open, on a drop into a snap zone, on a dock from the menu. The user may open
// it again while docked; the next dock folds it again. Undocking or closing
// gives back what the user had. A reload keeps whatever the rail was.
function foldForDock() {
  if (window.innerWidth >= DOCK_BREAKPOINT && railOpenNow()) {
    update({ foldedForChat: true });
  }
}

useChatPanel.subscribe((chat, prev) => {
  const docked = chatPanelIsDocked(chat);
  const wasDocked = chatPanelIsDocked(prev);
  if (docked && (!wasDocked || chat.docks !== prev.docks)) {
    foldForDock();
  } else if (!docked && wasDocked && useRail.getState().foldedForChat) {
    update({ foldedForChat: false });
  }
});

// Below the dock breakpoint a docked chat floats, so it only docks, and
// folds, once the window widens past it.
let wasWide = window.innerWidth >= DOCK_BREAKPOINT;
window.addEventListener('resize', () => {
  const wide = window.innerWidth >= DOCK_BREAKPOINT;
  if (wide && !wasWide && chatPanelIsDocked(useChatPanel.getState())) {
    foldForDock();
  }
  wasWide = wide;
});

function readFlag(storage: Storage, key: string): boolean {
  try {
    return storage.getItem(key) === 'true';
  } catch {
    return false;
  }
}

function writeFlag(storage: Storage, key: string, value: boolean) {
  try {
    storage.setItem(key, String(value));
  } catch {
    // Private mode or full storage: the rail still works, it just forgets.
  }
}

type RailState = {
  preference: boolean;
  foldedForChat: boolean;
  openedOn: string | null;
};
