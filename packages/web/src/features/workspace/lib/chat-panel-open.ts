import { create } from 'zustand';

const STORAGE_KEY = 'chat-panel';

const DEFAULTS: SavedChatPanel = {
  open: false,
  mode: 'left',
  float: null,
  floatSize: null,
  dockWidth: 372,
  conversationId: null,
};

function readSaved(): SavedChatPanel {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
}

function save({
  open,
  mode,
  float,
  floatSize,
  dockWidth,
  conversationId,
}: SavedChatPanel) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        open,
        mode,
        float,
        floatSize,
        dockWidth,
        conversationId,
      }),
    );
  } catch {
    // Private mode or full storage: the panel still works, it just forgets.
  }
}

export const useChatPanel = create<ChatPanelState>((set, get) => {
  const update = (patch: Partial<SavedChatPanel>) => {
    set(patch);
    save(get());
  };
  return {
    ...readSaved(),
    dragging: false,
    chatMounted: false,
    mountChat: () => set({ chatMounted: true }),
    setOpen: (open) => update({ open }),
    toggle: () => update({ open: !get().open }),
    dock: (side) => update({ open: true, mode: side }),
    floatAt: (position) =>
      update({ open: true, mode: 'float', float: position }),
    resizeFloat: (floatSize) => update({ floatSize }),
    setDockWidth: (dockWidth) => update({ dockWidth }),
    setConversationId: (conversationId) => update({ conversationId }),
    setDragging: (dragging) => set({ dragging }),
  };
});

// A docked panel takes room from the page, so the sidebar folds to make it.
export function chatPanelIsDocked(state: ChatPanelState): boolean {
  return state.open && state.mode !== 'float';
}

export type ChatPanelSide = 'left' | 'right';
export type ChatPanelMode = ChatPanelSide | 'float';
export type FloatPosition = { x: number; y: number };
export type FloatSize = { width: number; height: number };

type SavedChatPanel = {
  open: boolean;
  mode: ChatPanelMode;
  float: FloatPosition | null;
  floatSize: FloatSize | null;
  dockWidth: number;
  conversationId: string | null;
};

type ChatPanelState = SavedChatPanel & {
  dragging: boolean;
  chatMounted: boolean;
  mountChat: () => void;
  setOpen: (open: boolean) => void;
  toggle: () => void;
  dock: (side: ChatPanelSide) => void;
  floatAt: (position: FloatPosition) => void;
  resizeFloat: (size: FloatSize) => void;
  setDockWidth: (width: number) => void;
  setConversationId: (conversationId: string | null) => void;
  setDragging: (dragging: boolean) => void;
};
