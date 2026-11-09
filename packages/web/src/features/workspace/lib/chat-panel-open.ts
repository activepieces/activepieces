import { isNil, isObject } from '@activepieces/core-utils';
import { create } from 'zustand';

import { keepComposerFocus } from '@/features/chat/lib/keep-composer-focus';
import { authenticationSession } from '@/lib/authentication-session';
import { CHAT_ROUTE } from '@/lib/route-utils';
import { safeStorage } from '@/lib/safe-storage';
import { parseHandle } from '@/lib/shell-handle';

import { chatLayoutUtils } from './chat-layout';
import { layoutMove } from './layout-move';

function bindRouter(next: ChatRouter): () => void {
  router = next;
  return () => {
    if (router === next) router = null;
  };
}

function routeFor(conversationId: string | null): string {
  return conversationId ? `${CHAT_ROUTE}/${conversationId}` : CHAT_ROUTE;
}

function useChatRoute(): string {
  return routeFor(useChatPanel((s) => s.conversationId));
}

function expand(): void {
  const current = router;
  if (!current || current.isFullPage()) return;
  layoutMove.run({
    waitForRoute: true,
    update: () => {
      keepComposerFocus.keep();
      current.navigate({
        to: routeFor(useChatPanel.getState().conversationId),
        replace: false,
        state: { [EXPANDED_STATE]: true },
      });
    },
  });
}

function collapse(side: ChatPanelSide): void {
  const current = router;
  if (!current) return;
  const panel = useChatPanel.getState();
  if (!current.isFullPage()) {
    keepComposerFocus.keep();
    panel.dock(side);
    return;
  }
  layoutMove.run({
    waitForRoute: true,
    update: () => {
      keepComposerFocus.keep();
      panel.dock(side);
      current.navigate(backFromFullPage(current));
    },
  });
}

function backFromFullPage(current: ChatRouter): ChatNavTarget {
  const { state } = current.location();
  if (isObject(state) && state[EXPANDED_STATE] === true) {
    return { back: true };
  }
  return {
    to:
      useChatPanel.getState().lastPage ??
      authenticationSession.appendProjectRoutePrefix('/automations'),
    replace: false,
  };
}

function startNewChat(): void {
  const panel = useChatPanel.getState();
  panel.newChat();
  if (router?.isFullPage()) {
    showOnFullPage(null);
    return;
  }
  panel.setOpen(true);
}

function showOnFullPage(conversationId: string | null): void {
  const current = router;
  if (!current?.isFullPage()) return;
  const { state } = current.location();
  const expanded = isObject(state) && state[EXPANDED_STATE] === true;
  current.navigate({
    to: routeFor(conversationId),
    replace: true,
    state: expanded ? { [EXPANDED_STATE]: true } : undefined,
  });
}

function followRouter(target: FollowableRouter): () => void {
  syncWithRoute(target.state);
  return target.subscribe(syncWithRoute);
}

function syncWithRoute({ location, matches }: ChatRouteState): void {
  const handle = matches
    .map((match) => parseHandle(match.route.handle))
    .findLast((parsed) => parsed !== null);
  if (isNil(handle) || handle.redirectOnly === true) return;
  const panel = useChatPanel.getState();
  if (handle.chat !== 'full') {
    panel.setLastPage(`${location.pathname}${location.search}`);
    return;
  }
  const urlId =
    matches.findLast((match) => match.params.conversationId !== undefined)
      ?.params.conversationId ?? null;
  if (urlId !== null) panel.showConversation(urlId);
}

function createChatPanelStore() {
  return create<ChatPanelState>(initChatPanel);
}

function readSaved(): SavedChatPanel {
  const prefs = safeStorage.readJson({ area: 'local', key: STORAGE_KEY });
  const open = readOpen();
  if (!isObject(prefs)) return { ...DEFAULTS, open };
  return {
    open,
    mode: prefs.mode === 'right' ? 'right' : 'left',
    dockWidth:
      typeof prefs.dockWidth === 'number'
        ? chatLayoutUtils.dockWidthFor(prefs.dockWidth)
        : DEFAULTS.dockWidth,
  };
}

function readOpen(): boolean {
  const view = safeStorage.readJson({ area: 'session', key: TAB_VIEW_KEY });
  return isObject(view) && view.open === true;
}

function save({ open, mode, dockWidth }: SavedChatPanel) {
  safeStorage.writeJson({
    area: 'local',
    key: STORAGE_KEY,
    value: { mode, dockWidth },
  });
  safeStorage.writeJson({
    area: 'session',
    key: TAB_VIEW_KEY,
    value: { open },
  });
}

function readConversationId(): string | null {
  const owner = sessionOwner();
  if (isNil(owner)) return null;
  const tabKey = keyFor({ base: TAB_CONVERSATION_KEY, owner });
  const tab = safeStorage.read({ area: 'session', key: tabKey });
  if (tab !== null) return tab || null;
  const seeded = safeStorage.read({
    area: 'local',
    key: keyFor({ base: LAST_CONVERSATION_KEY, owner }),
  });
  safeStorage.write({ area: 'session', key: tabKey, value: seeded ?? '' });
  return seeded;
}

function saveConversationId(conversationId: string | null) {
  const owner = sessionOwner();
  if (isNil(owner)) return;
  safeStorage.write({
    area: 'session',
    key: keyFor({ base: TAB_CONVERSATION_KEY, owner }),
    value: conversationId ?? '',
  });
  if (conversationId) {
    safeStorage.write({
      area: 'local',
      key: keyFor({ base: LAST_CONVERSATION_KEY, owner }),
      value: conversationId,
    });
  }
}

function forgetConversation(conversationId: string): void {
  const owner = sessionOwner();
  if (isNil(owner)) return;
  const tabKey = keyFor({ base: TAB_CONVERSATION_KEY, owner });
  if (safeStorage.read({ area: 'session', key: tabKey }) === conversationId) {
    safeStorage.write({ area: 'session', key: tabKey, value: '' });
  }
  const lastKey = keyFor({ base: LAST_CONVERSATION_KEY, owner });
  if (safeStorage.read({ area: 'local', key: lastKey }) === conversationId) {
    safeStorage.remove({ area: 'local', key: lastKey });
  }
}

function sessionOwner(): string | null {
  const userId = authenticationSession.getCurrentUserId();
  if (isNil(userId)) return null;
  const platformId = authenticationSession.getPlatformId() ?? 'none';
  return `${platformId}:${userId}`;
}

function keyFor({ base, owner }: { base: string; owner: string }): string {
  return `${base}:${owner}`;
}

function readLastPage(): string | null {
  const owner = sessionOwner();
  if (isNil(owner)) return null;
  return safeStorage.read({
    area: 'session',
    key: keyFor({ base: TAB_LAST_PAGE_KEY, owner }),
  });
}

function syncWithSession(): void {
  const owner = sessionOwner();
  const previous = useChatPanel.getState().owner;
  if (owner === previous) return;
  if (!isNil(previous) && isNil(authenticationSession.getToken())) {
    safeStorage.remove({
      area: 'session',
      key: keyFor({ base: TAB_CONVERSATION_KEY, owner: previous }),
    });
    safeStorage.remove({
      area: 'session',
      key: keyFor({ base: TAB_LAST_PAGE_KEY, owner: previous }),
    });
  }
  useChatPanel.setState({
    owner,
    conversationId: readConversationId(),
    lastPage: readLastPage(),
  });
}

let router: ChatRouter | null = null;

const STORAGE_KEY = 'chat-panel';
const TAB_VIEW_KEY = 'chat:view';
const TAB_CONVERSATION_KEY = 'chat:conv';
const LAST_CONVERSATION_KEY = 'chat:last-conv';
const TAB_LAST_PAGE_KEY = 'chat:last-page';
const EXPANDED_STATE = 'chatExpanded';

const DEFAULTS: SavedChatPanel = {
  open: false,
  mode: 'left',
  dockWidth: chatLayoutUtils.DOCK_DEFAULT_WIDTH,
};

const initChatPanel = (
  set: SetChatPanel,
  get: () => ChatPanelState,
): ChatPanelState => {
  const update = (patch: Partial<SavedChatPanel>) => {
    set(patch);
    save(get());
  };
  const setConversation = (
    patch: Pick<ChatPanelState, 'conversationId'> &
      Partial<Pick<ChatPanelState, 'newChatToken' | 'pendingPrompt'>>,
  ) => {
    set(patch);
    saveConversationId(patch.conversationId);
  };
  return {
    ...readSaved(),
    owner: sessionOwner(),
    conversationId: readConversationId(),
    lastPage: readLastPage(),
    panelMounted: false,
    docks: 0,
    newChatToken: 0,
    pendingPrompt: undefined,
    setOpen: (open) => {
      if (open === get().open) return;
      layoutMove.run({ waitForRoute: false, update: () => update({ open }) });
    },
    dock: (side) =>
      layoutMove.run({
        waitForRoute: false,
        update: () => {
          set({ docks: get().docks + 1 });
          update({ open: true, mode: side });
        },
      }),
    setDockWidth: (width) =>
      update({ dockWidth: chatLayoutUtils.dockWidthFor(width) }),
    newChat: (prompt) => {
      setConversation({
        conversationId: null,
        newChatToken: get().newChatToken + 1,
        pendingPrompt: prompt,
      });
    },
    conversationCreated: (conversationId) =>
      setConversation({ conversationId, pendingPrompt: undefined }),
    conversationMissing: () => setConversation({ conversationId: null }),
    showConversation: (conversationId) => {
      if (conversationId === get().conversationId) return;
      if (conversationId === null) {
        get().newChat();
        return;
      }
      setConversation({
        conversationId,
        newChatToken: get().newChatToken + 1,
        pendingPrompt: undefined,
      });
    },
    setPanelMounted: (panelMounted) => set({ panelMounted }),
    setLastPage: (lastPage) => {
      if (lastPage === get().lastPage) return;
      set({ lastPage });
      const owner = sessionOwner();
      if (isNil(owner)) return;
      safeStorage.write({
        area: 'session',
        key: keyFor({ base: TAB_LAST_PAGE_KEY, owner }),
        value: lastPage,
      });
    },
  };
};

export const useChatPanel = createChatPanelStore();

authenticationSession.subscribe(syncWithSession);

export const chatPanelUtils = {
  createStore: createChatPanelStore,
  bindRouter,
  routeFor,
  useChatRoute,
  expand,
  collapse,
  startNewChat,
  showOnFullPage,
  forgetConversation,
  followRouter,
  routeCommitted: layoutMove.routeCommitted,
};

export type ChatPanelSide = 'left' | 'right';
type ChatRouter = {
  navigate: (target: ChatNavTarget) => void;
  location: () => {
    pathname: string;
    search: string;
    hash: string;
    state: unknown;
  };
  isFullPage: () => boolean;
};

export type ChatNavTarget =
  | { back: true }
  | { to: string; replace: boolean; state?: Record<string, unknown> };

type FollowableRouter = {
  state: ChatRouteState;
  subscribe: (listener: (state: ChatRouteState) => void) => () => void;
};

type ChatRouteState = {
  location: { pathname: string; search: string };
  matches: {
    params: Record<string, string | undefined>;
    route: { handle?: unknown };
  }[];
};

type SetChatPanel = (patch: Partial<ChatPanelState>) => void;

type SavedChatPanel = {
  open: boolean;
  mode: ChatPanelSide;
  dockWidth: number;
};

type ChatPanelState = SavedChatPanel & {
  owner: string | null;
  conversationId: string | null;
  lastPage: string | null;
  panelMounted: boolean;
  docks: number;
  newChatToken: number;
  pendingPrompt?: string;
  setOpen: (open: boolean) => void;
  dock: (side: ChatPanelSide) => void;
  setDockWidth: (width: number) => void;
  newChat: (prompt?: string) => void;
  conversationCreated: (conversationId: string) => void;
  conversationMissing: () => void;
  showConversation: (conversationId: string | null) => void;
  setPanelMounted: (panelMounted: boolean) => void;
  setLastPage: (lastPage: string) => void;
};
