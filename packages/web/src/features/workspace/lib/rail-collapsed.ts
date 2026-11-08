import { useCallback } from 'react';
import { matchPath, useLocation, useMatches } from 'react-router-dom';
import { create } from 'zustand';

import { routesThatRequireProjectId } from '@/lib/route-utils';

import { chatLayoutUtils } from './chat-layout';
import { chatPanelUtils, useChatPanel } from './chat-panel-open';

const PREFERENCE_KEY = 'primary-rail-collapsed';
const FOLDED_FOR_CHAT_KEY = 'primary-rail-folded-for-chat';

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

export function railOpenNow(): boolean {
  return railIsOpen({
    state: useRail.getState(),
    pathname: window.location.pathname,
    chatPage: false,
  });
}

function foldForDock() {
  if (window.innerWidth >= chatLayoutUtils.DOCK_BREAKPOINT && railOpenNow()) {
    update({ foldedForChat: true });
  }
}

useChatPanel.subscribe((chat, prev) => {
  const docked = chatPanelUtils.isDocked(chat);
  const wasDocked = chatPanelUtils.isDocked(prev);
  if (
    docked &&
    (!wasDocked || chat.docks !== prev.docks || (chat.split && !prev.split))
  ) {
    foldForDock();
  } else if (!docked && wasDocked && useRail.getState().foldedForChat) {
    update({ foldedForChat: false });
  }
});

let wasWide = window.innerWidth >= chatLayoutUtils.DOCK_BREAKPOINT;
window.addEventListener('resize', () => {
  const wide = window.innerWidth >= chatLayoutUtils.DOCK_BREAKPOINT;
  if (wide && !wasWide && chatPanelUtils.isDocked(useChatPanel.getState())) {
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
    return;
  }
}

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
