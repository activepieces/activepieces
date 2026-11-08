import { create } from 'zustand';

import { startStructuralMove } from './chat-layout';

const STORAGE_KEY = 'chat-panel';
const TAB_CONVERSATION_KEY = 'chat:conv';
const LAST_CONVERSATION_KEY = 'chat:last-conv';
const TAB_LAST_PAGE_KEY = 'chat:last-page';

const DEFAULTS: SavedChatPanel = {
  open: false,
  mode: 'left',
  float: null,
  floatSize: null,
  dockWidth: 372,
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
    newChatToken: 0,
    pendingPrompt: undefined,
    gesture: 'idle',
    docks: 0,
    chatMounted: false,
    mountChat: () => set({ chatMounted: true }),
    setOpen: (open) => {
      startStructuralMove(open ? 'enter' : 'exit');
      update({ open });
    },
    toggle: () => get().setOpen(!get().open),
    dock: (side) => {
      startStructuralMove('enter');
      set({ docks: get().docks + 1 });
      update({ open: true, mode: side });
    },
    floatAt: (position) => {
      startStructuralMove('exit');
      update({ open: true, mode: 'float', float: position });
    },
    resizeFloat: (floatSize) => update({ floatSize }),
    setDockWidth: (dockWidth) => update({ dockWidth }),
    openConversation: (conversationId) => {
      if (conversationId === get().conversationId) return;
      setConversation({ conversationId, pendingPrompt: undefined });
    },
    newChat: (prompt) =>
      setConversation({
        conversationId: null,
        newChatToken: get().newChatToken + 1,
        pendingPrompt: prompt,
      }),
    conversationCreated: (conversationId) =>
      setConversation({ conversationId, pendingPrompt: undefined }),
    conversationMissing: () => setConversation({ conversationId: null }),
    setGesture: (gesture) => set({ gesture }),
    setLastPage: (lastPage) => {
      if (lastPage === get().lastPage) return;
      set({ lastPage });
      saveLastPage(lastPage);
    },
  };
});

export function chatPanelIsDocked(state: ChatPanelState): boolean {
  return state.open && state.mode !== 'float';
}

function readSaved(): SavedChatPanel {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
}

function save({ open, mode, float, floatSize, dockWidth }: SavedChatPanel) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ open, mode, float, floatSize, dockWidth }),
    );
  } catch {
    return;
  }
}

function readConversationId(): string | null {
  try {
    const tab = sessionStorage.getItem(TAB_CONVERSATION_KEY);
    if (tab !== null) return tab || null;
    const seeded =
      localStorage.getItem(LAST_CONVERSATION_KEY) ?? migrateOldConversationId();
    sessionStorage.setItem(TAB_CONVERSATION_KEY, seeded ?? '');
    return seeded;
  } catch {
    return null;
  }
}

function migrateOldConversationId(): string | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  const parsed: unknown = raw ? JSON.parse(raw) : null;
  const old =
    typeof parsed === 'object' &&
    parsed !== null &&
    'conversationId' in parsed &&
    typeof parsed.conversationId === 'string'
      ? parsed.conversationId
      : null;
  if (old) localStorage.setItem(LAST_CONVERSATION_KEY, old);
  return old;
}

function saveConversationId(conversationId: string | null) {
  try {
    sessionStorage.setItem(TAB_CONVERSATION_KEY, conversationId ?? '');
    if (conversationId) {
      localStorage.setItem(LAST_CONVERSATION_KEY, conversationId);
    }
  } catch {
    return;
  }
}

function readLastPage(): string | null {
  try {
    return sessionStorage.getItem(TAB_LAST_PAGE_KEY);
  } catch {
    return null;
  }
}

function saveLastPage(lastPage: string) {
  try {
    sessionStorage.setItem(TAB_LAST_PAGE_KEY, lastPage);
  } catch {
    return;
  }
}

export type ChatPanelSide = 'left' | 'right';
export type ChatPanelMode = ChatPanelSide | 'float';
export type FloatPosition = { x: number; y: number };
export type FloatSize = { width: number; height: number };
export type ChatGesture = 'idle' | 'dragging' | 'settling';

type SavedChatPanel = {
  open: boolean;
  mode: ChatPanelMode;
  float: FloatPosition | null;
  floatSize: FloatSize | null;
  dockWidth: number;
};

type ChatPanelState = SavedChatPanel & {
  conversationId: string | null;
  lastPage: string | null;
  newChatToken: number;
  pendingPrompt?: string;
  gesture: ChatGesture;
  docks: number;
  chatMounted: boolean;
  mountChat: () => void;
  setOpen: (open: boolean) => void;
  toggle: () => void;
  dock: (side: ChatPanelSide) => void;
  floatAt: (position: FloatPosition) => void;
  resizeFloat: (size: FloatSize) => void;
  setDockWidth: (width: number) => void;
  openConversation: (conversationId: string) => void;
  newChat: (prompt?: string) => void;
  conversationCreated: (conversationId: string) => void;
  conversationMissing: () => void;
  setGesture: (gesture: ChatGesture) => void;
  setLastPage: (lastPage: string) => void;
};
