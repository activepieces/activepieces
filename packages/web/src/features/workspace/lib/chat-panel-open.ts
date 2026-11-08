import { isObject } from '@activepieces/core-utils';
import { t } from 'i18next';
import { create } from 'zustand';

import { CHAT_ROUTE } from '@/lib/route-utils';

import {
  DOCK_BREAKPOINT,
  MOBILE_BREAKPOINT,
  startStructuralMove,
} from './chat-layout';

const STORAGE_KEY = 'chat-panel';
const TAB_VIEW_KEY = 'chat:view';
const TAB_CONVERSATION_KEY = 'chat:conv';
const LAST_CONVERSATION_KEY = 'chat:last-conv';
const TAB_LAST_PAGE_KEY = 'chat:last-page';

const DEFAULTS: SavedChatPanel = {
  open: false,
  split: false,
  mode: 'left',
  float: null,
  floatSize: null,
  dockWidth: 372,
};

export const useChatPanel = create<ChatPanelState>((set, get) => {
  const update = (
    patch: Partial<SavedChatPanel & Pick<ChatPanelState, 'openBeforeSplit'>>,
  ) => {
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
    moving: null,
    gateOpen: false,
    splitName: null,
    openBeforeSplit: null,
    announcement: null,
    mountChat: () => set({ chatMounted: true }),
    setOpen: (open) => {
      startStructuralMove(open ? 'enter' : 'exit');
      update({ open, split: false, openBeforeSplit: null });
    },
    toggle: () => get().setOpen(!get().open),
    dock: (side) => {
      startStructuralMove('enter');
      set({ docks: get().docks + 1 });
      update({ open: true, mode: side, split: false, openBeforeSplit: null });
    },
    floatAt: (position) => {
      startStructuralMove('exit');
      update({
        open: true,
        mode: 'float',
        float: position,
        split: false,
        openBeforeSplit: null,
      });
    },
    enterSplit: (name) => {
      if (get().split) {
        if (name !== undefined) set({ splitName: name });
        return;
      }
      startStructuralMove('fold');
      set({ openBeforeSplit: get().open, splitName: name ?? null });
      update({ open: true, split: true });
    },
    leaveSplit: () => {
      if (!get().split) return;
      const restore = get().openBeforeSplit;
      set({ openBeforeSplit: null });
      update({ split: false, open: restore ?? get().open });
    },
    setMoving: (moving) => {
      if (moving === get().moving) return;
      set({ moving });
      if (movingGuard) clearTimeout(movingGuard);
      movingGuard = moving
        ? setTimeout(() => set({ moving: null }), MOVING_GUARD_MS)
        : null;
    },
    setGateOpen: (gateOpen) => {
      if (gateOpen !== get().gateOpen) set({ gateOpen });
    },
    announce: (text) =>
      set({ announcement: { text, id: (get().announcement?.id ?? 0) + 1 } }),
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
  return state.open && (state.split || state.mode !== 'float');
}

export function bindChatRouter(next: ChatRouter): () => void {
  router = next;
  return () => {
    if (router === next) router = null;
  };
}

function openBeside({
  route,
  push,
  name,
}: {
  route: string;
  push: boolean;
  name?: string;
}): void {
  const current = router;
  if (!current) return;
  const location = current.location();
  if (location.pathname === route.split(/[?#]/)[0]) return;
  const panel = useChatPanel.getState();
  const fromFull = current.isFullPage();
  const viewportWidth = window.innerWidth;
  const previous = isObject(location.state) ? location.state : {};
  const showsSplit = fromFull || panel.split;
  const backToChat =
    (push && fromFull) || (!push && previous.chatSplitBack === true);
  keepFocus();
  if (viewportWidth < MOBILE_BREAKPOINT) {
    if (panel.open) panel.setOpen(false);
    current.navigate({
      to: route,
      replace: !push || location.hash === MOBILE_SHEET_HASH,
      state: { chatSplit: false, chatSplitBack: false },
    });
  } else {
    if (fromFull) {
      current.captureAnchor();
      if (viewportWidth >= DOCK_BREAKPOINT && !reducedMotion()) {
        panel.setMoving('enter');
      }
      panel.enterSplit(name);
    }
    current.navigate({
      to: route,
      replace: !push,
      state: { chatSplit: showsSplit, chatSplitBack: backToChat },
    });
  }
  panel.announce(
    name
      ? t('Opened {name} beside the chat', { name })
      : t('Opened the page beside the chat'),
  );
}

function expand(): void {
  const current = router;
  if (!current) return;
  const now = Date.now();
  if (now - lastExpandAt < EXPAND_DEBOUNCE_MS) return;
  lastExpandAt = now;
  const location = current.location();
  const panel = useChatPanel.getState();
  current.captureAnchor();
  if (panel.split && !reducedMotion() && window.innerWidth >= DOCK_BREAKPOINT) {
    panel.setMoving('exit');
  }
  panel.leaveSplit();
  if (isObject(location.state) && location.state.chatSplitBack === true) {
    current.navigate({ back: true });
    return;
  }
  const id = panel.conversationId;
  current.navigate({
    to: id ? `${CHAT_ROUTE}/${id}` : CHAT_ROUTE,
    replace: false,
  });
}

function keepFocus(): void {
  releaseFocus?.();
  const kept = document.activeElement;
  if (!(kept instanceof HTMLElement) || !kept.closest('[data-chat-root]')) {
    return;
  }
  let tabbing = false;
  const onKey = (event: KeyboardEvent) => {
    tabbing = event.key === 'Tab';
  };
  const onPointer = (event: PointerEvent) => {
    const target = event.target;
    if (!(target instanceof Element) || !target.closest('[data-chat-root]')) {
      release();
    }
  };
  const onFocus = (event: FocusEvent) => {
    const target = event.target;
    if (
      tabbing ||
      !kept.isConnected ||
      !(target instanceof Element) ||
      target.closest('[data-chat-root], [role="dialog"], [role="menu"]')
    ) {
      return;
    }
    kept.focus({ preventScroll: true });
  };
  const release = () => {
    document.removeEventListener('focusin', onFocus, true);
    document.removeEventListener('pointerdown', onPointer, true);
    document.removeEventListener('keydown', onKey, true);
    clearTimeout(timer);
    if (releaseFocus === release) releaseFocus = null;
  };
  const timer = setTimeout(release, FOCUS_GUARD_MS);
  document.addEventListener('focusin', onFocus, true);
  document.addEventListener('pointerdown', onPointer, true);
  document.addEventListener('keydown', onKey, true);
  releaseFocus = release;
}

function reducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function readSaved(): SavedChatPanel {
  const view = readView();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const prefs: unknown = raw ? JSON.parse(raw) : null;
    return { ...DEFAULTS, ...(isObject(prefs) ? prefs : {}), ...view };
  } catch {
    return { ...DEFAULTS, ...view };
  }
}

function readView(): Pick<SavedChatPanel, 'open' | 'split'> {
  try {
    const raw = sessionStorage.getItem(TAB_VIEW_KEY);
    const view: unknown = raw ? JSON.parse(raw) : null;
    if (!isObject(view)) return { open: false, split: false };
    return { open: view.open === true, split: view.split === true };
  } catch {
    return { open: false, split: false };
  }
}

function save({
  open,
  split,
  mode,
  float,
  floatSize,
  dockWidth,
}: SavedChatPanel) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ mode, float, floatSize, dockWidth }),
    );
    sessionStorage.setItem(TAB_VIEW_KEY, JSON.stringify({ open, split }));
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

let router: ChatRouter | null = null;
let lastExpandAt = 0;
let movingGuard: ReturnType<typeof setTimeout> | null = null;
let releaseFocus: (() => void) | null = null;
const EXPAND_DEBOUNCE_MS = 220;
const MOVING_GUARD_MS = 900;
const FOCUS_GUARD_MS = 30_000;

export const chatTransitions = { openBeside, expand };

export const MOBILE_SHEET_HASH = '#chat';

export type ChatPanelSide = 'left' | 'right';
export type ChatPanelMode = ChatPanelSide | 'float';
export type FloatPosition = { x: number; y: number };
export type FloatSize = { width: number; height: number };
export type ChatGesture = 'idle' | 'dragging' | 'settling';
export type ChatMove = 'enter' | 'exit';
export type ChatRouter = {
  navigate: (target: ChatNavTarget) => void;
  location: () => {
    pathname: string;
    hash: string;
    state: unknown;
  };
  isFullPage: () => boolean;
  captureAnchor: () => void;
};

export type ChatNavTarget =
  | { back: true }
  | { to: string; replace: boolean; state?: Record<string, unknown> };

type SavedChatPanel = {
  open: boolean;
  split: boolean;
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
  moving: ChatMove | null;
  gateOpen: boolean;
  splitName: string | null;
  openBeforeSplit: boolean | null;
  announcement: { text: string; id: number } | null;
  mountChat: () => void;
  enterSplit: (name?: string) => void;
  leaveSplit: () => void;
  setMoving: (moving: ChatMove | null) => void;
  setGateOpen: (gateOpen: boolean) => void;
  announce: (text: string) => void;
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
