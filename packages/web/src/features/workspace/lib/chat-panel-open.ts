import { isObject } from '@activepieces/core-utils';
import { t } from 'i18next';
import { create } from 'zustand';

import { authenticationSession } from '@/lib/authentication-session';
import { CHAT_ROUTE } from '@/lib/route-utils';
import { safeStorage } from '@/lib/safe-storage';

import { chatLayoutUtils } from './chat-layout';

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
  current.navigate({
    to: routeFor(useChatPanel.getState().conversationId),
    replace: false,
    state: { [EXPANDED_STATE]: true },
  });
}

function openBeside({
  route,
  push,
  name,
}: {
  route: string;
  push: boolean;
  name: string;
}): void {
  const current = router;
  if (!current || current.location().pathname === route) return;
  const panel = useChatPanel.getState();
  if (current.isFullPage()) panel.dock(panel.mode);
  current.navigate({ to: route, replace: !push });
  panel.announce(t('Opened {name} beside the chat.', { name }));
}

function collapse(side: ChatPanelSide): void {
  const current = router;
  if (!current) return;
  const panel = useChatPanel.getState();
  panel.dock(side);
  if (!current.isFullPage()) return;
  const { state } = current.location();
  if (isObject(state) && state[EXPANDED_STATE] === true) {
    current.navigate({ back: true });
    return;
  }
  current.navigate({
    to:
      panel.lastPage ??
      authenticationSession.appendProjectRoutePrefix('/automations'),
    replace: false,
  });
}

function startNewChat(): void {
  const panel = useChatPanel.getState();
  panel.newChat();
  if (router?.isFullPage()) {
    router.navigate({ to: CHAT_ROUTE, replace: true });
    return;
  }
  panel.setOpen(true);
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
  const tab = safeStorage.read({ area: 'session', key: TAB_CONVERSATION_KEY });
  if (tab !== null) return tab || null;
  const seeded = safeStorage.read({
    area: 'local',
    key: LAST_CONVERSATION_KEY,
  });
  safeStorage.write({
    area: 'session',
    key: TAB_CONVERSATION_KEY,
    value: seeded ?? '',
  });
  return seeded;
}

function saveConversationId(conversationId: string | null) {
  safeStorage.write({
    area: 'session',
    key: TAB_CONVERSATION_KEY,
    value: conversationId ?? '',
  });
  if (conversationId) {
    safeStorage.write({
      area: 'local',
      key: LAST_CONVERSATION_KEY,
      value: conversationId,
    });
  }
}

function readAutoFollow(): boolean {
  return safeStorage.read({ area: 'local', key: AUTO_FOLLOW_KEY }) !== 'false';
}

function readLastPage(): string | null {
  return safeStorage.read({ area: 'session', key: TAB_LAST_PAGE_KEY });
}

let router: ChatRouter | null = null;

const STORAGE_KEY = 'chat-panel';
const TAB_VIEW_KEY = 'chat:view';
const TAB_CONVERSATION_KEY = 'chat:conv';
const LAST_CONVERSATION_KEY = 'chat:last-conv';
const TAB_LAST_PAGE_KEY = 'chat:last-page';
const EXPANDED_STATE = 'chatExpanded';
const AUTO_FOLLOW_KEY = 'chat:auto-follow';
const SHEET_HASH = '#chat';

const DEFAULTS: SavedChatPanel = {
  open: false,
  mode: 'left',
  dockWidth: chatLayoutUtils.DOCK_DEFAULT_WIDTH,
};

export const useChatPanel = create<ChatPanelState>((set, get) => {
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
    conversationId: readConversationId(),
    lastPage: readLastPage(),
    autoFollow: readAutoFollow(),
    announcement: null,
    newChatToken: 0,
    pendingPrompt: undefined,
    setOpen: (open) => update({ open }),
    dock: (side) => update({ open: true, mode: side }),
    setDockWidth: (width) =>
      update({ dockWidth: chatLayoutUtils.dockWidthFor(width) }),
    newChat: (prompt) =>
      setConversation({
        conversationId: null,
        newChatToken: get().newChatToken + 1,
        pendingPrompt: prompt,
      }),
    conversationCreated: (conversationId) =>
      setConversation({ conversationId, pendingPrompt: undefined }),
    conversationMissing: () => setConversation({ conversationId: null }),
    showConversation: (conversationId) => {
      if (conversationId === get().conversationId) return;
      if (conversationId === null) {
        get().newChat();
        return;
      }
      setConversation({ conversationId, pendingPrompt: undefined });
    },
    setAutoFollow: (autoFollow) => {
      set({ autoFollow });
      safeStorage.write({
        area: 'local',
        key: AUTO_FOLLOW_KEY,
        value: String(autoFollow),
      });
    },
    announce: (text) =>
      set({ announcement: { text, id: (get().announcement?.id ?? 0) + 1 } }),
    setLastPage: (lastPage) => {
      if (lastPage === get().lastPage) return;
      set({ lastPage });
      safeStorage.write({
        area: 'session',
        key: TAB_LAST_PAGE_KEY,
        value: lastPage,
      });
    },
  };
});

export const chatPanelUtils = {
  bindRouter,
  routeFor,
  useChatRoute,
  openBeside,
  expand,
  collapse,
  startNewChat,
  SHEET_HASH,
};

export type ChatPanelSide = 'left' | 'right';
export type ChatRouter = {
  navigate: (target: ChatNavTarget) => void;
  location: () => { pathname: string; state: unknown };
  isFullPage: () => boolean;
};

export type ChatNavTarget =
  | { back: true }
  | { to: string; replace: boolean; state?: Record<string, unknown> };

type SavedChatPanel = {
  open: boolean;
  mode: ChatPanelSide;
  dockWidth: number;
};

type ChatPanelState = SavedChatPanel & {
  conversationId: string | null;
  lastPage: string | null;
  autoFollow: boolean;
  announcement: { text: string; id: number } | null;
  newChatToken: number;
  pendingPrompt?: string;
  setOpen: (open: boolean) => void;
  dock: (side: ChatPanelSide) => void;
  setDockWidth: (width: number) => void;
  newChat: (prompt?: string) => void;
  conversationCreated: (conversationId: string) => void;
  conversationMissing: () => void;
  showConversation: (conversationId: string | null) => void;
  setAutoFollow: (autoFollow: boolean) => void;
  announce: (text: string) => void;
  setLastPage: (lastPage: string) => void;
};
