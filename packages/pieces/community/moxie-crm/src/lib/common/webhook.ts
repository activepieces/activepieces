import { HttpMethod } from '@activepieces/pieces-common';
import { Store } from '@activepieces/pieces-framework';
import { moxieRequest, responseStatusOf } from './client';
import { MoxieCredentials, MoxieStoredHook } from './models';

export const MOXIE_HOOK_STORE_KEY = 'moxie_rest_hook';

export const MOXIE_STALE_HOOKS_STORE_KEY = 'moxie_stale_hooks';

export const moxieWebhook = {
  async subscribe({
    credentials,
    type,
    hookUrl,
  }: {
    credentials: MoxieCredentials;
    type: string;
    hookUrl: string;
  }): Promise<MoxieStoredHook> {
    const response = await moxieRequest<unknown>({
      credentials,
      method: HttpMethod.POST,
      path: '/api/subscribe',
      body: { type, hookUrl },
    });
    const id = typeof response === 'string' && response.trim() !== '' ? response.trim() : null;
    return { id, type, hookUrl };
  },

  async unsubscribe({ credentials, hook }: { credentials: MoxieCredentials; hook: MoxieStoredHook }): Promise<void> {
    await moxieRequest<unknown>({
      credentials,
      method: HttpMethod.POST,
      path: '/api/unsubscribe',
      body: hook.id === null ? { type: hook.type, hookUrl: hook.hookUrl } : { id: hook.id, type: hook.type, hookUrl: hook.hookUrl },
    });
  },

  async enable({
    credentials,
    store,
    type,
    hookUrl,
  }: {
    credentials: MoxieCredentials;
    store: Store;
    type: string;
    hookUrl: string;
  }): Promise<void> {
    const previous = await store.get<unknown>(MOXIE_HOOK_STORE_KEY);
    const staleBefore = parseHooks({ value: await store.get<unknown>(MOXIE_STALE_HOOKS_STORE_KEY) });
    const hook = await moxieWebhook.subscribe({ credentials, type, hookUrl });
    const replaced = isStoredHook(previous) && needsRemoval({ previous, current: hook }) ? previous : undefined;
    try {
      if (replaced !== undefined) {
        await store.put(MOXIE_STALE_HOOKS_STORE_KEY, [...staleBefore, replaced]);
      }
      await store.put(MOXIE_HOOK_STORE_KEY, hook);
    } catch (error) {
      await moxieWebhook.unsubscribe({ credentials, hook }).catch(() => undefined);
      throw error;
    }
    if (replaced === undefined) {
      return;
    }
    const removed = await unsubscribeIgnoringMissing({ credentials, hook: replaced }).then(
      () => true,
      () => false,
    );
    if (removed) {
      const restore = staleBefore.length === 0 ? store.delete(MOXIE_STALE_HOOKS_STORE_KEY) : store.put(MOXIE_STALE_HOOKS_STORE_KEY, staleBefore);
      await restore.catch(() => undefined);
    }
  },

  async disable({ credentials, store }: { credentials: MoxieCredentials; store: Store }): Promise<void> {
    const stale = parseHooks({ value: await store.get<unknown>(MOXIE_STALE_HOOKS_STORE_KEY) });
    if (stale.length > 0) {
      const results = await Promise.all(
        stale.map((hook) =>
          unsubscribeIgnoringMissing({ credentials, hook }).then(
            () => undefined,
            () => hook,
          ),
        ),
      );
      const remaining = results.filter((hook): hook is MoxieStoredHook => hook !== undefined);
      if (remaining.length === 0) {
        await store.delete(MOXIE_STALE_HOOKS_STORE_KEY);
      } else {
        await store.put(MOXIE_STALE_HOOKS_STORE_KEY, remaining);
      }
    }
    const stored = await store.get<unknown>(MOXIE_HOOK_STORE_KEY);
    if (!isStoredHook(stored)) {
      return;
    }
    await unsubscribeIgnoringMissing({ credentials, hook: stored });
    await store.delete(MOXIE_HOOK_STORE_KEY);
  },

  acceptDelivery({ eventType, payload }: { eventType: string; payload: MoxieDeliveryPayload }): unknown[] {
    const deliveredType = headerOf({ headers: payload.headers, name: 'x-event-type' });
    if (deliveredType !== undefined && deliveredType !== eventType) {
      return [];
    }
    const origin = headerOf({ headers: payload.headers, name: 'x-event-origin' });
    if (origin !== undefined && origin.toLowerCase() !== 'withmoxie.com') {
      return [];
    }
    return [payload.body];
  },
};

async function unsubscribeIgnoringMissing({
  credentials,
  hook,
}: {
  credentials: MoxieCredentials;
  hook: MoxieStoredHook;
}): Promise<void> {
  try {
    await moxieWebhook.unsubscribe({ credentials, hook });
  } catch (error) {
    if (responseStatusOf({ error }) !== 404) {
      throw error;
    }
  }
}

function needsRemoval({ previous, current }: { previous: MoxieStoredHook; current: MoxieStoredHook }): boolean {
  if (previous.id !== null) {
    return previous.id !== current.id;
  }
  return previous.type !== current.type || previous.hookUrl !== current.hookUrl;
}

function parseHooks({ value }: { value: unknown }): MoxieStoredHook[] {
  return Array.isArray(value) ? value.filter(isStoredHook) : [];
}

function headerOf({ headers, name }: { headers: Record<string, unknown> | undefined; name: string }): string | undefined {
  if (headers === undefined || headers === null) {
    return undefined;
  }
  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() === name && typeof value === 'string' && value.trim() !== '') {
      return value.trim();
    }
  }
  return undefined;
}

function isStoredHook(value: unknown): value is MoxieStoredHook {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const id: unknown = Reflect.get(value, 'id');
  return (
    (id === null || typeof id === 'string') &&
    typeof Reflect.get(value, 'type') === 'string' &&
    typeof Reflect.get(value, 'hookUrl') === 'string'
  );
}

type MoxieDeliveryPayload = {
  body: unknown;
  headers?: Record<string, unknown>;
};
