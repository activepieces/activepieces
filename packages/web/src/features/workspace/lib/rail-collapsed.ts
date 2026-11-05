import { useCallback } from 'react';
import { matchPath, useLocation } from 'react-router-dom';
import { create } from 'zustand';

import { CHAT_ROUTE, routesThatRequireProjectId } from '@/lib/route-utils';

import {
  DOCK_BREAKPOINT,
  dockCrampsPage,
  startStructuralMove,
} from './chat-layout';
import { chatPanelIsDocked, useChatPanel } from './chat-panel-open';

const PREFERENCE_KEY = 'primary-rail-collapsed';
// Set while the rail is folded only to make room for the docked chat, so
// closing the chat gives the sidebar back. Survives a reload, like the chat.
const FOLDED_FOR_CHAT_KEY = 'primary-rail-folded-for-chat';
// Set once the user re-opens a sidebar the chat folded. For the rest of the
// session the chat never folds it again.
const FOLD_DECLINED_KEY = 'primary-rail-chat-fold-declined';

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
  foldDeclined: readFlag(sessionStorage, FOLD_DECLINED_KEY),
  openedOn: null,
}));

function update(patch: Partial<RailState>) {
  useRail.setState(patch);
  const state = useRail.getState();
  writeFlag(localStorage, PREFERENCE_KEY, state.preference);
  writeFlag(localStorage, FOLDED_FOR_CHAT_KEY, state.foldedForChat);
  writeFlag(sessionStorage, FOLD_DECLINED_KEY, state.foldDeclined);
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
      const { foldedForChat, foldDeclined } = useRail.getState();
      startStructuralMove(next ? 'enter' : 'exit');
      update({
        preference: !next,
        foldedForChat: false,
        foldDeclined: foldDeclined || (next && foldedForChat),
        openedOn: pathname,
      });
    },
    [pathname],
  );

  return { open, onOpenChange };
}

export function railOpenNow(): boolean {
  return railIsOpen(useRail.getState(), window.location.pathname);
}

// Whether the rail will still be open once the chat docks, for previews.
export function railOpenAfterDock(): boolean {
  const open = railOpenNow();
  if (!open || chatPanelIsDocked(useChatPanel.getState())) {
    return open;
  }
  return !shouldFoldForDock();
}

function shouldFoldForDock(): boolean {
  const viewport = window.innerWidth;
  return (
    !useRail.getState().foldDeclined &&
    viewport >= DOCK_BREAKPOINT &&
    dockCrampsPage(viewport, true)
  );
}

function foldIfCramped() {
  if (
    chatPanelIsDocked(useChatPanel.getState()) &&
    !useRail.getState().foldedForChat &&
    railOpenNow() &&
    shouldFoldForDock()
  ) {
    update({ foldedForChat: true });
  }
}

// Docking the chat folds the sidebar once, only when the page would get
// cramped. Undocking or closing gives back what the user had.
useChatPanel.subscribe((chat, prev) => {
  const docked = chatPanelIsDocked(chat);
  if (docked === chatPanelIsDocked(prev)) {
    return;
  }
  if (docked) {
    foldIfCramped();
  } else if (useRail.getState().foldedForChat) {
    update({ foldedForChat: false });
  }
});
// The same holds when a docked chat is restored, or the window shrinks under
// it. Once the user re-opens the sidebar, none of this applies again.
foldIfCramped();
window.addEventListener('resize', foldIfCramped);

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
  foldDeclined: boolean;
  openedOn: string | null;
};
