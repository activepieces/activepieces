import { API_URL } from '@/lib/api';
import { authenticationSession } from '@/lib/authentication-session';

const STORAGE_KEY = 'chat-debug';
const FLUSH_INTERVAL_MS = 1000;
const MAX_BUFFER = 50;

function computeEnabled(): boolean {
  try {
    return (
      import.meta.env.DEV && window.localStorage.getItem(STORAGE_KEY) === '1'
    );
  } catch {
    return false;
  }
}

let enabled = computeEnabled();
let buffer: Fields[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let context: Fields = {};

function flush(): void {
  if (buffer.length === 0) return;
  const events = buffer;
  buffer = [];
  if (flushTimer !== null) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
  const token = authenticationSession.getToken();
  void fetch(`${API_URL}/v1/logs/client`, {
    method: 'POST',
    keepalive: true,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ events }),
  }).catch(() => {
    /* best-effort: never let debug logging surface an error to the user */
  });
}

function scheduleFlush(): void {
  if (flushTimer !== null) return;
  flushTimer = setTimeout(flush, FLUSH_INTERVAL_MS);
}

function emit(level: Level, fields: Fields, msg: string): void {
  if (!enabled) return;
  const event: Fields = {
    level,
    msg,
    timestamp: new Date().toISOString(),
    ...context,
    ...fields,
  };
  // Live console view in addition to the shipped event.
  // eslint-disable-next-line no-console
  console.debug(`[chat:${level}] ${msg}`, fields);
  buffer.push(event);
  if (buffer.length >= MAX_BUFFER) {
    flush();
  } else {
    scheduleFlush();
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      flush();
    }
  });
}

export const chatDebug = {
  isEnabled: (): boolean => enabled,
  setContext: (fields: Fields): void => {
    context = { ...context, ...fields };
  },
  clearContext: (): void => {
    context = {};
  },
  toggle: (on: boolean): void => {
    try {
      window.localStorage.setItem(STORAGE_KEY, on ? '1' : '0');
    } catch {
      /* ignore */
    }
    enabled = computeEnabled();
  },
  debug: (fields: Fields, msg: string): void => emit('debug', fields, msg),
  info: (fields: Fields, msg: string): void => emit('info', fields, msg),
  warn: (fields: Fields, msg: string): void => emit('warn', fields, msg),
  error: (fields: Fields, msg: string): void => emit('error', fields, msg),
};

type Level = 'debug' | 'info' | 'warn' | 'error';
type Fields = Record<string, unknown>;
