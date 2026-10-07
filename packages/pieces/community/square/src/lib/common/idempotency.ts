import crypto from 'crypto';
import { SquareApiError } from './client';

const MAX_CUSTOM_KEY_LENGTH = 45;
const PENDING_KEY_PREFIX = 'square_idem_';

function customKey({ value }: { value: unknown }): string | null {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return null;
  }
  const trimmed = value.trim();
  if (trimmed.length > MAX_CUSTOM_KEY_LENGTH) {
    throw new Error(`Idempotency Key must be at most ${MAX_CUSTOM_KEY_LENGTH} characters.`);
  }
  return trimmed;
}

async function execute<T>({ context, action, input, send }: { context: IdempotencyContext; action: string; input: unknown; send: (params: { idempotencyKey: string }) => Promise<T> }): Promise<T> {
  const custom = customKey({ value: context.propsValue['idempotency_key'] });
  if (custom !== null) {
    return send({ idempotencyKey: custom });
  }
  const runId = context.run?.id;
  if (!runId) {
    return send({ idempotencyKey: crypto.randomUUID() });
  }
  const storeKey = pendingStoreKey({ runId, stepName: context.step?.name });
  const fingerprint = hash({ value: `${action}|${canonical(input)}` });
  const reused = await pendingKey({ store: context.store, storeKey, fingerprint });
  const idempotencyKey = reused ?? crypto.randomUUID();
  if (reused === null) {
    await context.store.put(storeKey, { key: idempotencyKey, fingerprint });
  }
  try {
    const result = await send({ idempotencyKey });
    await context.store.delete(storeKey);
    return result;
  } catch (error) {
    if (isRejected({ error })) {
      await context.store.delete(storeKey);
    }
    throw error;
  }
}

async function isResend({ context, action, input }: { context: IdempotencyContext; action: string; input: unknown }): Promise<boolean> {
  if (customKey({ value: context.propsValue['idempotency_key'] }) !== null) {
    return true;
  }
  const runId = context.run?.id;
  if (!runId) {
    return false;
  }
  const storeKey = pendingStoreKey({ runId, stepName: context.step?.name });
  const fingerprint = hash({ value: `${action}|${canonical(input)}` });
  return (await pendingKey({ store: context.store, storeKey, fingerprint })) !== null;
}

async function pendingKey({ store, storeKey, fingerprint }: { store: IdempotencyStore; storeKey: string; fingerprint: string }): Promise<string | null> {
  const stored = await store.get<unknown>(storeKey);
  if (stored === null || typeof stored !== 'object' || Array.isArray(stored)) {
    return null;
  }
  const key: unknown = Reflect.get(stored, 'key');
  const storedFingerprint: unknown = Reflect.get(stored, 'fingerprint');
  return typeof key === 'string' && key.length > 0 && storedFingerprint === fingerprint ? key : null;
}

function isRejected({ error }: { error: unknown }): boolean {
  return error instanceof SquareApiError && error.status >= 400 && error.status < 500 && error.status !== 408;
}

function pendingStoreKey({ runId, stepName }: { runId: string; stepName: string | undefined }): string {
  return `${PENDING_KEY_PREFIX}${hash({ value: `${runId}|${stepName ?? ''}` }).slice(0, 48)}`;
}

function hash({ value }: { value: string }): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function canonical(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(canonical).join(',')}]`;
  }
  if (value !== null && typeof value === 'object') {
    const entries = Object.entries(value)
      .filter((entry) => entry[1] !== undefined)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${canonical(v)}`).join(',')}}`;
  }
  return JSON.stringify(value ?? null);
}

export const squareIdempotency = { execute, isResend, customKey, canonical, MAX_CUSTOM_KEY_LENGTH };

export type IdempotencyStore = {
  get: <T>(key: string) => Promise<T | null>;
  put: <T>(key: string, value: T) => Promise<T>;
  delete: (key: string) => Promise<void>;
};

type IdempotencyContext = {
  propsValue: Record<string, unknown>;
  store: IdempotencyStore;
  run?: { id: string };
  step?: { name: string };
};
