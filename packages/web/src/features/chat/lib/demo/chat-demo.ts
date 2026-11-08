import { useSyncExternalStore } from 'react';
import { z } from 'zod';

import { safeStorage } from '@/lib/safe-storage';

import { chatDemoGate } from './chat-demo-gate';

export function useChatDemoSettings(): DemoSettings {
  return useSyncExternalStore(subscribeSettings, () => settings);
}

function urlDemoParam(): string | null {
  const value = new URLSearchParams(window.location.search).get('chatDemo');
  return value && value !== '0' ? value : null;
}

function readAutoplayScenarioId(): string | null {
  const value = urlDemoParam();
  return value && value !== '1' ? value : null;
}

function readSettings(): DemoSettings {
  const fallback: DemoSettings = {
    active: urlDemoParam() !== null,
    speed: 'normal',
    fakeHistory: false,
    lastScenarioId: null,
  };
  const parsed = SavedSettings.safeParse(
    safeStorage.readJson({ area: 'local', key: STORAGE_KEY }),
  );
  const saved = parsed.success ? parsed.data : {};
  return {
    active: saved.active === true || fallback.active,
    speed: SPEEDS.find((s) => s === saved.speed) ?? fallback.speed,
    fakeHistory: saved.fakeHistory === true,
    lastScenarioId: saved.lastScenarioId ?? null,
    ...(autoplayScenarioId ? { speed: 'instant' as const } : {}),
  };
}

function update(patch: Partial<DemoSettings>): void {
  settings = { ...settings, ...patch };
  safeStorage.writeJson({ area: 'local', key: STORAGE_KEY, value: settings });
  settingsListeners.forEach((listener) => listener());
}

function subscribeSettings(listener: () => void): () => void {
  settingsListeners.add(listener);
  return () => settingsListeners.delete(listener);
}

function onEvent(handler: (event: DemoSocketEvent) => void): () => void {
  eventListeners.add(handler);
  return () => eventListeners.delete(handler);
}

function publish(event: DemoSocketEvent): void {
  eventListeners.forEach((listener) => listener(event));
}

function onPlay(handler: (target: DemoPlayTarget) => void): () => void {
  playListeners.add(handler);
  return () => playListeners.delete(handler);
}

function requestPlay(target: DemoPlayTarget): void {
  playListeners.forEach((listener) => listener(target));
}

const STORAGE_KEY = 'ap-chat-demo';
const SPEEDS = ['slow', 'normal', 'instant'] as const;
const SPEED_FACTOR: Record<DemoSpeed, number> = {
  slow: 3,
  normal: 1,
  instant: 0,
};
const SavedSettings = z
  .object({
    active: z.boolean().optional(),
    speed: z.string().optional(),
    fakeHistory: z.boolean().optional(),
    lastScenarioId: z.string().nullable().optional(),
  })
  .passthrough();
const autoplayScenarioId = readAutoplayScenarioId();
const settingsListeners = new Set<() => void>();
const eventListeners = new Set<(event: DemoSocketEvent) => void>();
const playListeners = new Set<(target: DemoPlayTarget) => void>();
let settings: DemoSettings = readSettings();

export const chatDemo = {
  autoplayScenarioId,
  DEMO_ID_PREFIX: chatDemoGate.DEMO_ID_PREFIX,
  SPEEDS,
  isActive: (): boolean => settings.active,
  isDemoId: chatDemoGate.isDemoId,
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
