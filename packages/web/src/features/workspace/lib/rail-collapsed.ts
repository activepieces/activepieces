import { useCallback } from 'react';
import { matchPath, useLocation, useMatches } from 'react-router-dom';
import { create } from 'zustand';

import { routesThatRequireProjectId } from '@/lib/route-utils';
import { safeStorage } from '@/lib/safe-storage';

import { chatLayoutUtils } from './chat-layout';
import { useChatPanel } from './chat-panel-open';
import { windowSizeHooks } from './window-size-hooks';

const PREFERENCE_KEY = 'primary-rail-collapsed';
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

function readFlag({ area, key }: { area: 'local' | 'session'; key: string }) {
  return safeStorage.read({ area, key }) === 'true';
}

function readFoldedForChat(): boolean {
  if (!useChatPanel.getState().open) return false;
  const saved = safeStorage.read({ area: 'session', key: FOLDED_FOR_CHAT_KEY });
  return saved === null ? desktop() : saved === 'true';
}

function desktop(): boolean {
  return !windowSizeHooks.isPhone();
}

const useRail = create<RailState>(() => ({
  preference: readFlag({ area: 'local', key: PREFERENCE_KEY }),
  foldedForChat: readFoldedForChat(),
  openedOn: null,
}));

function update(patch: Partial<RailState>) {
  useRail.setState(patch);
  const state = useRail.getState();
  safeStorage.write({
    area: 'local',
    key: PREFERENCE_KEY,
    value: String(state.preference),
  });
  safeStorage.write({
    area: 'session',
    key: FOLDED_FOR_CHAT_KEY,
    value: String(state.foldedForChat),
  });
}

function railIsOpen({
  state,
  pathname,
  chatPage,
}: {
  state: RailState;
  pathname: string;
  chatPage: boolean;
}): boolean {
  const routeHoldsItClosed =
    state.openedOn !== pathname &&
    ROUTES_THAT_HOLD_THE_RAIL_CLOSED.some(
      (route) => matchPath(route, pathname) !== null,
    );
  const chatHoldsItClosed = state.foldedForChat && !chatPage;
  return !(state.preference || routeHoldsItClosed || chatHoldsItClosed);
}

export function useRailOpen(): boolean {
  const { pathname } = useLocation();
  const chatPage = useMatches().some(({ handle }) => isChatPageHandle(handle));
  return useRail((state) => railIsOpen({ state, pathname, chatPage }));
}

export function useRailOpenState() {
  const open = useRailOpen();
  const { pathname } = useLocation();

  const onOpenChange = useCallback(
    (next: boolean) => {
      chatLayoutUtils.startStructuralMove(next ? 'enter' : 'exit');
      update({ preference: !next, foldedForChat: false, openedOn: pathname });
    },
    [pathname],
  );

  return { open, onOpenChange };
}

function railOpenNow(): boolean {
  return railIsOpen({
    state: useRail.getState(),
    pathname: window.location.pathname,
    chatPage: false,
  });
}

// The chat takes the room the labels had: docking it folds the rail to icons
// at any desktop width, and the fold lasts for the tab until the chat closes
// or the user opens the rail again.
function foldForDock() {
  if (desktop() && railOpenNow()) {
    update({ foldedForChat: true });
  }
}

useChatPanel.subscribe((chat, prev) => {
  if (chat.open && (!prev.open || chat.docks !== prev.docks)) {
    foldForDock();
  } else if (!chat.open && prev.open && useRail.getState().foldedForChat) {
    update({ foldedForChat: false });
  }
});

let wasDesktop = desktop();
windowSizeHooks.subscribe(() => {
  const now = desktop();
  if (now && !wasDesktop && useChatPanel.getState().open) {
    foldForDock();
  }
  wasDesktop = now;
});

function isChatPageHandle(handle: unknown): boolean {
  return (
    typeof handle === 'object' &&
    handle !== null &&
    'chat' in handle &&
    handle.chat === 'full'
  );
}

type RailState = {
  preference: boolean;
  foldedForChat: boolean;
  openedOn: string | null;
};

export const railUtils = { railIsOpen, store: useRail };
