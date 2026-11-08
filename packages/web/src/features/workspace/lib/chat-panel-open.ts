import { isObject } from '@activepieces/core-utils';
import { t } from 'i18next';
import { create } from 'zustand';

import { CHAT_ROUTE } from '@/lib/route-utils';
import { safeStorage } from '@/lib/safe-storage';

import { chatLayoutUtils } from './chat-layout';

function isDocked(state: ChatPanelState): boolean {
  return state.open && (state.split || state.mode !== 'float');
}

function bindRouter(next: ChatRouter): () => void {
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
  const carried = !fromFull && previous.chatSplitBack === true;
  const replace = !push || carried;
  const backToChat = (push && fromFull) || carried;
  keepFocus();
  if (viewportWidth < chatLayoutUtils.MOBILE_BREAKPOINT) {
    if (panel.open) panel.setOpen(false);
    current.navigate({
      to: route,
      replace: !push || location.hash === MOBILE_SHEET_HASH,
      state: { chatSplit: false, chatSplitBack: false },
    });
  } else {
    if (fromFull) {
      current.captureAnchor();
      if (
        viewportWidth >= chatLayoutUtils.DOCK_BREAKPOINT &&
        !chatLayoutUtils.prefersReducedMotion()
      ) {
        panel.setMoving('enter');
      }
      panel.enterSplit(name);
    }
    current.navigate({
      to: route,
      replace,
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
  keepFocus();
  const location = current.location();
  const panel = useChatPanel.getState();
  current.captureAnchor();
  if (
    panel.split &&
    !chatLayoutUtils.prefersReducedMotion() &&
    window.innerWidth >= chatLayoutUtils.DOCK_BREAKPOINT
  ) {
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
  if (!(kept instanceof HTMLElement) || !kept.closest(CHAT_ROOT)) {
    return;
  }
  let frame = 0;
  let tabbing = false;
  const onKey = (event: KeyboardEvent) => {
    tabbing = tabbing || event.key === 'Tab';
  };
  const onPointer = (event: PointerEvent) => {
    const target = event.target;
    if (!(target instanceof Element) || !target.closest(CHAT_ROOT)) {
      release();
    }
  };
  const target = (): HTMLElement | null => {
    if (kept.isConnected) return kept;
    return document.querySelector<HTMLElement>(`${CHAT_ROOT} ${COMPOSER}`);
  };
  const check = () => {
    const active = document.activeElement;
    const into = target();
    if (tabbing || !into) {
      release();
      return;
    }
    if (active === into) {
      frame = requestAnimationFrame(check);
      return;
    }
    if (
      active &&
      active !== document.body &&
      active.closest(`${CHAT_ROOT}, ${LAYERS}`)
    ) {
      release();
      return;
    }
    if (into.closest('[inert]')) {
      frame = requestAnimationFrame(check);
      return;
    }
    into.focus({ preventScroll: true });
    release();
  };
  const release = () => {
    cancelAnimationFrame(frame);
    document.removeEventListener('pointerdown', onPointer, true);
    document.removeEventListener('keydown', onKey, true);
    clearTimeout(timer);
    if (releaseFocus === release) releaseFocus = null;
  };
  const timer = setTimeout(release, FOCUS_GUARD_MS);
  document.addEventListener('pointerdown', onPointer, true);
  document.addEventListener('keydown', onKey, true);
  frame = requestAnimationFrame(check);
  releaseFocus = release;
}

function readSaved(): SavedChatPanel {
  const prefs = safeStorage.readJson({ area: 'local', key: STORAGE_KEY });
  return { ...DEFAULTS, ...(isObject(prefs) ? prefs : {}), ...readView() };
}

function readView(): Pick<SavedChatPanel, 'open' | 'split'> {
  const view = safeStorage.readJson({ area: 'session', key: TAB_VIEW_KEY });
  if (!isObject(view)) return { open: false, split: false };
  return { open: view.open === true, split: view.split === true };
}

function save({
  open,
  split,
  mode,
  float,
  floatSize,
  dockWidth,
}: SavedChatPanel) {
  safeStorage.writeJson({
    area: 'local',
    key: STORAGE_KEY,
    value: { mode, float, floatSize, dockWidth },
  });
  safeStorage.writeJson({
    area: 'session',
    key: TAB_VIEW_KEY,
    value: { open, split },
  });
}

function readConversationId(): string | null {
  const tab = safeStorage.read({ area: 'session', key: TAB_CONVERSATION_KEY });
  if (tab !== null) return tab || null;
  const seeded =
    safeStorage.read({ area: 'local', key: LAST_CONVERSATION_KEY }) ??
    migrateOldConversationId();
  safeStorage.write({
    area: 'session',
    key: TAB_CONVERSATION_KEY,
    value: seeded ?? '',
  });
  return seeded;
}

function migrateOldConversationId(): string | null {
  const parsed = safeStorage.readJson({ area: 'local', key: STORAGE_KEY });
  const old =
    isObject(parsed) && typeof parsed.conversationId === 'string'
      ? parsed.conversationId
      : null;
  if (old) {
    safeStorage.write({
      area: 'local',
      key: LAST_CONVERSATION_KEY,
      value: old,
    });
  }
  return old;
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

function readLastPage(): string | null {
  return safeStorage.read({ area: 'session', key: TAB_LAST_PAGE_KEY });
}

function saveLastPage(lastPage: string) {
  safeStorage.write({
    area: 'session',
    key: TAB_LAST_PAGE_KEY,
    value: lastPage,
  });
}

let router: ChatRouter | null = null;
let lastExpandAt = 0;
let movingGuard: ReturnType<typeof setTimeout> | null = null;
let releaseFocus: (() => void) | null = null;
const EXPAND_DEBOUNCE_MS = 220;
const MOVING_GUARD_MS = 900;
const FOCUS_GUARD_MS = 2000;
const CHAT_ROOT = '[data-chat-root]';
const COMPOSER = 'textarea, [contenteditable="true"]';
const LAYERS = '[role="dialog"], [role="alertdialog"], [role="menu"]';

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
  dockWidth: chatLayoutUtils.DOCK_DEFAULT_WIDTH,
};

const MOBILE_SHEET_HASH = '#chat';

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
      chatLayoutUtils.startStructuralMove(open ? 'enter' : 'exit');
      update({ open, split: false, openBeforeSplit: null });
    },
    toggle: () => get().setOpen(!get().open),
    dock: (side) => {
      chatLayoutUtils.startStructuralMove('enter');
      set({ docks: get().docks + 1 });
      update({ open: true, mode: side, split: false, openBeforeSplit: null });
    },
    floatAt: (position) => {
      chatLayoutUtils.startStructuralMove('exit');
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
      chatLayoutUtils.startStructuralMove('fold');
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

export const chatPanelUtils = {
  isDocked,
  bindRouter,
  openBeside,
  expand,
  MOBILE_SHEET_HASH,
};

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
