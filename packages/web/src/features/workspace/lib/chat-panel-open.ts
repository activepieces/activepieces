import { isNil, isObject } from '@activepieces/core-utils';
import { create } from 'zustand';

import { authenticationSession } from '@/lib/authentication-session';
import { safeStorage } from '@/lib/safe-storage';

import { chatLayoutUtils } from './chat-layout';

function startNewChat(): void {
  const panel = useChatPanel.getState();
  panel.newChat();
  panel.setOpen(true);
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

function sessionOwner(): string | null {
  const userId = authenticationSession.getCurrentUserId();
  if (isNil(userId)) return null;
  const platformId = authenticationSession.getPlatformId() ?? 'none';
  return `${platformId}:${userId}`;
}

function keyFor({ base, owner }: { base: string; owner: string }): string {
  return `${base}:${owner}`;
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
  }
  useChatPanel.setState({
    owner,
    conversationId: readConversationId(),
  });
}

const STORAGE_KEY = 'chat-panel';
const TAB_VIEW_KEY = 'chat:view';
const TAB_CONVERSATION_KEY = 'chat:conv';
const LAST_CONVERSATION_KEY = 'chat:last-conv';

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
    panelMounted: false,
    newChatToken: 0,
    pendingPrompt: undefined,
    setOpen: (open) => {
      if (open === get().open) return;
      update({ open });
    },
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
    setPanelMounted: (panelMounted) => set({ panelMounted }),
  };
};

export const useChatPanel = createChatPanelStore();

authenticationSession.subscribe(syncWithSession);

export const chatPanelUtils = {
  createStore: createChatPanelStore,
  startNewChat,
};

export type ChatPanelSide = 'left' | 'right';

type SetChatPanel = (patch: Partial<ChatPanelState>) => void;

type SavedChatPanel = {
  open: boolean;
  mode: ChatPanelSide;
  dockWidth: number;
};

type ChatPanelState = SavedChatPanel & {
  owner: string | null;
  conversationId: string | null;
  panelMounted: boolean;
  newChatToken: number;
  pendingPrompt?: string;
  setOpen: (open: boolean) => void;
  setDockWidth: (width: number) => void;
  newChat: (prompt?: string) => void;
  conversationCreated: (conversationId: string) => void;
  setPanelMounted: (panelMounted: boolean) => void;
};
