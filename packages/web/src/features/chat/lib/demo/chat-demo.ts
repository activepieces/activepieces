import { useSyncExternalStore } from 'react';

// Demo scenarios for the chat: scripted replies that play through the real
// chat UI, so every state can be reviewed without an AI or a backend.
//
// This file is the one switch. When `available` is false (production builds
// opened without ?chatDemo)
// nothing here does anything and the chat talks to the server as usual. When
// it is true, only conversations the demo created (ids starting `demo-`) are
// faked; real conversations keep using the API.

// `?chatDemo=1` turns demo mode on for this tab, in any build (it stays on for
// the tab via sessionStorage). `?chatDemo=<scenarioId>` also opens the panel
// and plays that scenario at instant speed: one URL per chat state.
const TAB_KEY = 'ap-chat-demo-tab';

function urlDemoParam(): string | null {
  if (typeof window === 'undefined') return null;
  const value = new URLSearchParams(window.location.search).get('chatDemo');
  return value && value !== '0' ? value : null;
}

function tabRemembersDemo(): boolean {
  try {
    if (urlDemoParam()) window.sessionStorage.setItem(TAB_KEY, '1');
    return window.sessionStorage.getItem(TAB_KEY) === '1';
  } catch {
    return urlDemoParam() !== null;
  }
}

function urlAsksForDemo(): boolean {
  return urlDemoParam() !== null;
}

const autoplayScenarioId: string | null = (() => {
  const value = urlDemoParam();
  return value && value !== '1' ? value : null;
})();

const available: boolean = import.meta.env.DEV || tabRemembersDemo();

const STORAGE_KEY = 'ap-chat-demo';
const DEMO_ID_PREFIX = 'demo-';

const SPEEDS = ['slow', 'normal', 'instant'] as const;

function readSettings(): DemoSettings {
  const fallback: DemoSettings = {
    active: urlAsksForDemo(),
    speed: 'normal',
    fakeHistory: false,
    lastScenarioId: null,
    ...(autoplayScenarioId ? { speed: 'instant' as const } : {}),
  };
  if (!available) return fallback;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<DemoSettings>;
    return {
      active: parsed.active === true || fallback.active,
      speed: SPEEDS.find((s) => s === parsed.speed) ?? 'normal',
      fakeHistory: parsed.fakeHistory === true,
      lastScenarioId:
        typeof parsed.lastScenarioId === 'string'
          ? parsed.lastScenarioId
          : null,
      ...(autoplayScenarioId ? { speed: 'instant' as const } : {}),
    };
  } catch {
    return fallback;
  }
}

let settings: DemoSettings = readSettings();
const settingsListeners = new Set<() => void>();

function update(patch: Partial<DemoSettings>): void {
  settings = { ...settings, ...patch };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Settings only live for this page then.
  }
  settingsListeners.forEach((listener) => listener());
}

function subscribeSettings(listener: () => void): () => void {
  settingsListeners.add(listener);
  return () => settingsListeners.delete(listener);
}

// The fake "socket": the demo backend publishes the same events the server
// sends over the websocket, and the chat's stream reader listens here too.
const eventListeners = new Set<(event: DemoSocketEvent) => void>();

function onEvent(handler: (event: DemoSocketEvent) => void): () => void {
  if (!available) return noop;
  eventListeners.add(handler);
  return () => eventListeners.delete(handler);
}

function publish(event: DemoSocketEvent): void {
  eventListeners.forEach((listener) => listener(event));
}

// Picking a scenario asks the panel to open a chat: a fresh one that sends the
// scenario's prompt, or an existing (seeded) demo conversation.
const playListeners = new Set<(target: DemoPlayTarget) => void>();

function onPlay(handler: (target: DemoPlayTarget) => void): () => void {
  if (!available) return noop;
  playListeners.add(handler);
  return () => playListeners.delete(handler);
}

function requestPlay(target: DemoPlayTarget): void {
  playListeners.forEach((listener) => listener(target));
}

const SPEED_FACTOR: Record<DemoSpeed, number> = {
  slow: 3,
  normal: 1,
  instant: 0,
};

function noop(): void {
  return undefined;
}

export const chatDemo = {
  available,
  autoplayScenarioId: available ? autoplayScenarioId : null,
  DEMO_ID_PREFIX,
  SPEEDS,
  isActive: (): boolean => available && settings.active,
  isDemoId: (id: string | null | undefined): boolean =>
    available && typeof id === 'string' && id.startsWith(DEMO_ID_PREFIX),
  settings: (): DemoSettings => settings,
  setActive: (active: boolean) => update({ active }),
  setSpeed: (speed: DemoSpeed) => update({ speed }),
  setFakeHistory: (fakeHistory: boolean) => update({ fakeHistory }),
  setLastScenario: (lastScenarioId: string) =>
    update({ lastScenarioId, active: true }),
  speedFactor: (): number => SPEED_FACTOR[settings.speed],
  subscribeSettings,
  onEvent,
  publish,
  onPlay,
  requestPlay,
};

export function useChatDemoSettings(): DemoSettings {
  return useSyncExternalStore(subscribeSettings, () => settings);
}

export type DemoSpeed = (typeof SPEEDS)[number];

export type DemoSettings = {
  active: boolean;
  speed: DemoSpeed;
  fakeHistory: boolean;
  lastScenarioId: string | null;
};

export type DemoSocketEvent = {
  conversationId: string;
  runId?: string;
  type: string;
  data: unknown;
};

export type DemoPlayTarget =
  | { kind: 'prompt'; prompt: string }
  | { kind: 'conversation'; conversationId: string };
