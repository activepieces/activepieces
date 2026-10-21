import { HttpMethod } from '@activepieces/pieces-common';
import { ChargekeepApiError, chargekeepClient } from '../common/client';

const MAX_SEEN = 500;

type Store = {
  get<T>(key: string): Promise<T | null>;
  put<T>(key: string, value: T): Promise<T>;
  delete(key: string): Promise<void>;
};

type HookContext = { auth: unknown; webhookUrl: string; store: Store };
type DisableContext = { auth: unknown; store: Store };
type RunContext = { store: Store; payload: { body: unknown } };

type WebhookState = { webhookId: number };

async function subscribe({ auth, eventName, targetUrl }: { auth: unknown; eventName: string; targetUrl: string }): Promise<number> {
  const result = await chargekeepClient.request({ auth, method: HttpMethod.POST, path: '/api/services/Platform/Event/Subscribe', body: { eventName, targetUrl } });
  const id = chargekeepClient.isRecord(result) ? result['id'] : undefined;
  if (typeof id !== 'number' || !Number.isInteger(id)) throw new Error('ChargeKeep did not return an event subscription ID.');
  return id;
}

async function unsubscribe({ auth, webhookId }: { auth: unknown; webhookId: number }): Promise<void> {
  try {
    await chargekeepClient.request({ auth, method: HttpMethod.POST, path: '/api/services/Platform/Event/Unsubscribe', query: { id: webhookId } });
  } catch (error) {
    if (error instanceof ChargekeepApiError && (error.status === 404 || /does not exist/i.test(error.message))) return;
    throw error;
  }
}

function idOf(value: unknown): string | undefined {
  return typeof value === 'number' || (typeof value === 'string' && value !== '') ? String(value) : undefined;
}

export const deliveryKeys = {
  byId(body: Record<string, unknown>): string | undefined {
    const id = idOf(body['id']);
    return id === undefined ? undefined : `${id}:${typeof body['eventTime'] === 'string' ? body['eventTime'] : ''}`;
  },
  byTransactionId(body: Record<string, unknown>): string | undefined {
    const transaction = body['transaction'];
    return chargekeepClient.isRecord(transaction) ? idOf(transaction['id']) : undefined;
  },
};

export function createChargekeepWebhookHooks({ eventName, storeKey, deliveryKey }: { eventName: string; storeKey: string; deliveryKey: (body: Record<string, unknown>) => string | undefined }) {
  const seenKey = `${storeKey}_seen`;
  return {
    async onEnable(context: HookContext) {
      const webhookId = await subscribe({ auth: context.auth, eventName, targetUrl: context.webhookUrl });
      try {
        await context.store.put<WebhookState>(storeKey, { webhookId });
      } catch (error) {
        await unsubscribe({ auth: context.auth, webhookId }).catch(() => undefined);
        throw error;
      }
    },
    async onDisable(context: DisableContext) {
      const state = await context.store.get<WebhookState>(storeKey);
      if (state && typeof state.webhookId === 'number') {
        await unsubscribe({ auth: context.auth, webhookId: state.webhookId });
      }
      await context.store.delete(storeKey);
      await context.store.delete(seenKey);
    },
    async run(context: RunContext) {
      const body = context.payload.body;
      const events = (Array.isArray(body) ? body : [body]).filter(chargekeepClient.isRecord);
      if (events.length === 0) return [];
      const seen = (await context.store.get<string[]>(seenKey)) ?? [];
      const fresh: Record<string, unknown>[] = [];
      const keys: string[] = [];
      for (const event of events) {
        const key = deliveryKey(event);
        if (key !== undefined && (seen.includes(key) || keys.includes(key))) continue;
        if (key !== undefined) keys.push(key);
        fresh.push(event);
      }
      if (keys.length > 0) await context.store.put<string[]>(seenKey, [...seen, ...keys].slice(-MAX_SEEN));
      return fresh;
    },
  };
}
