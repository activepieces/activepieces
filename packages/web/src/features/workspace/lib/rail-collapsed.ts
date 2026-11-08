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
const FOLD_BELOW = 960;

const AGENT_ROUTES = [
  routesThatRequireProjectId.singleAgent,
  routesThatRequireProjectId.singleAgentRuns,
];

const ROUTES_THAT_HOLD_THE_RAIL_CLOSED = AGENT_ROUTES.flatMap((route) => [
  route,
  `/projects/:projectId${route}`,
]);

const useRail = create<RailState>(() => ({
  preference: safeStorage.readFlag({ area: 'local', key: PREFERENCE_KEY }),
  foldedForChat:
    useChatPanel.getState().open &&
    (safeStorage.readFlag({ area: 'session', key: FOLDED_FOR_CHAT_KEY }) ||
      cramped()),
  openedOn: null,
}));

function update(patch: Partial<RailState>) {
  useRail.setState(patch);
  const state = useRail.getState();
  safeStorage.writeFlag({
    area: 'local',
    key: PREFERENCE_KEY,
    value: state.preference,
  });
  safeStorage.writeFlag({
    area: 'session',
    key: FOLDED_FOR_CHAT_KEY,
    value: state.foldedForChat,
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

export function railOpenNow(): boolean {
  return railIsOpen({
    state: useRail.getState(),
    pathname: window.location.pathname,
    chatPage: false,
  });
}

function foldForDock() {
  if (window.innerWidth >= chatLayoutUtils.MOBILE_BREAKPOINT && railOpenNow()) {
    update({ foldedForChat: true });
  }
}

useChatPanel.subscribe((chat, prev) => {
  if (
    chat.open &&
    (!prev.open || chat.docks !== prev.docks || (chat.split && !prev.split))
  ) {
    foldForDock();
  } else if (!chat.open && prev.open && useRail.getState().foldedForChat) {
    update({ foldedForChat: false });
  }
});

let wasCramped = cramped();
windowSizeHooks.subscribe(() => {
  const now = cramped();
  if (now && !wasCramped && useChatPanel.getState().open) {
    foldForDock();
  }
  wasCramped = now;
});

function cramped(): boolean {
  const width = window.innerWidth;
  return width >= chatLayoutUtils.MOBILE_BREAKPOINT && width < FOLD_BELOW;
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
