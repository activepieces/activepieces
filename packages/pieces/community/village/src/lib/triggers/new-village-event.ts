import { createHmac, randomBytes, timingSafeEqual } from 'crypto';
import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { villageAuth } from '../common/auth';
import { villageApi, VillageApiError, VILLAGE_WEBHOOK_EVENT_OPTIONS } from '../common/client';
import { villageSchemas } from '../common/schemas';

const STORE_KEY = 'village_new_event_webhook';
const SEEN_KEY = 'village_new_event_seen';
const SIGNATURE_HEADER = 'x-village-signature';
const DELIVERY_HEADER = 'x-village-delivery';
const DEDUPE_WINDOW_MS = 15 * 60 * 1000;
const MAX_SEEN = 500;
const SIGNATURE_LABELS = ['sha256', 'v1', 't'];


export const newVillageEvent = createTrigger({
  auth: villageAuth,
  name: 'new_village_event',
  classification: 'READ',
  displayName: 'New Village Event',
  description:
    'Triggers when Village sends an event: a new connection, a job change, a new path to someone, new search results, list changes, or sequence email activity. The webhook is registered when the flow is turned on and removed when it is turned off.',
  aiMetadata: {
    description:
      'Fires once per Village webhook delivery for the selected event types (all types when none are chosen). Deliveries are signed and checked against a secret generated for this flow; unsigned or mismatched deliveries are dropped, and repeated deliveries of the same event ID are dropped.',
  },
  props: {
    event_filter: Property.StaticMultiSelectDropdown({
      displayName: 'Event Types',
      description: 'Only receive these event types. Leave empty to receive every event type, including ones Village adds later.',
      required: false,
      options: { options: VILLAGE_WEBHOOK_EVENT_OPTIONS },
    }),
  },
  outputSchema: villageSchemas.newVillageEvent,
  sampleData: {
    event: 'list_added',
    timestamp: '2026-11-17T08:25:02.137Z',
    user_id: 13965,
    webhook_id: 13,
    data: {
      list_id: 1342,
      list_title: 'ap-trigger-e2e',
      list_type: 'people',
      list_url: 'https://village.ai/network/lists?savedListId=1342',
      source: 'search',
      search_query: null,
      item_count: 0,
    },
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    const secret = randomBytes(32).toString('hex');
    const events = context.propsValue.event_filter ?? [];
    const body: Record<string, unknown> = {
      url: context.webhookUrl,
      description: 'Activepieces flow trigger',
      secret,
      is_active: true,
    };
    if (events.length > 0) {
      body['event_filter'] = events;
    }
    const response = await villageApi.call<{ data?: { id?: string | number | null } }>({
      token: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/v2/webhooks',
      body,
    });
    const createdId = response.data?.id;
    if (createdId === undefined || createdId === null || String(createdId).length === 0) {
      await removeWebhooksForUrl({ token: context.auth.secret_text, url: context.webhookUrl });
      throw new Error(
        'Village did not return a webhook ID when registering the trigger; any webhook it created for this flow was removed. Try turning the flow on again.',
      );
    }
    const webhookId = String(createdId);
    try {
      await context.store.put<StoredWebhook>(STORE_KEY, { webhookId, secret });
    } catch (error) {
      await villageApi
        .call({
          token: context.auth.secret_text,
          method: HttpMethod.DELETE,
          path: `/v2/webhooks/${villageApi.encodePathId(webhookId)}`,
        })
        .catch(() => undefined);
      throw error;
    }
  },
  async onDisable(context) {
    const stored = await context.store.get<StoredWebhook>(STORE_KEY);
    if (!stored) {
      return;
    }
    try {
      await villageApi.call({
        token: context.auth.secret_text,
        method: HttpMethod.DELETE,
        path: `/v2/webhooks/${villageApi.encodePathId(stored.webhookId)}`,
      });
    } catch (error) {
      if (!(error instanceof VillageApiError && error.status === 404)) {
        throw error;
      }
    }
    await context.store.delete(STORE_KEY);
    await context.store.delete(SEEN_KEY);
  },
  async run(context) {
    const stored = await context.store.get<StoredWebhook>(STORE_KEY);
    if (!stored) {
      return [];
    }
    const signature = readHeader({ headers: context.payload.headers, name: SIGNATURE_HEADER });
    const rawBody = toRawString(context.payload.rawBody);
    if (!signature || rawBody === null || !verifySignature({ secret: stored.secret, signature, rawBody })) {
      return [];
    }
    const body = context.payload.body;
    const eventId =
      readHeader({ headers: context.payload.headers, name: DELIVERY_HEADER }) ?? readEventId(body);
    if (eventId !== null) {
      const seen = (await context.store.get<SeenEvent[]>(SEEN_KEY)) ?? [];
      const now = Date.now();
      const fresh = seen.filter((entry) => now - entry.at < DEDUPE_WINDOW_MS);
      if (fresh.some((entry) => entry.id === eventId)) {
        return [];
      }
      await context.store.put<SeenEvent[]>(SEEN_KEY, [...fresh, { id: eventId, at: now }].slice(-MAX_SEEN));
    }
    return [body];
  },
});

async function removeWebhooksForUrl({ token, url }: { token: string; url: string }): Promise<void> {
  const found = await villageApi
    .call<{ data?: { id?: string; url?: string }[] }>({
      token,
      method: HttpMethod.GET,
      path: '/v2/webhooks',
      queryParams: { search: url, limit: '100' },
    })
    .catch(() => ({ data: [] }));
  const matches = (found.data ?? []).filter((hook) => hook.url === url && typeof hook.id === 'string');
  for (const hook of matches) {
    await villageApi
      .call({ token, method: HttpMethod.DELETE, path: `/v2/webhooks/${villageApi.encodePathId(String(hook.id))}` })
      .catch(() => undefined);
  }
}

function readHeader({ headers, name }: { headers: Record<string, string> | undefined; name: string }): string | null {
  if (!headers) {
    return null;
  }
  const match = Object.entries(headers).find(([key]) => key.toLowerCase() === name);
  return match ? String(match[1]) : null;
}

function toRawString(raw: unknown): string | null {
  if (typeof raw === 'string') {
    return raw;
  }
  if (Buffer.isBuffer(raw)) {
    return raw.toString('utf8');
  }
  return null;
}

function verifySignature({ secret, signature, rawBody }: { secret: string; signature: string; rawBody: string }): boolean {
  const parsed = signature
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
    .map(parseSignaturePart);
  const timestamp = parsed.find((part) => part.label === 't')?.value;
  const candidates = parsed.filter((part) => part.label !== 't').map((part) => part.value);
  const payloads = timestamp === undefined ? [rawBody] : [rawBody, `${timestamp}.${rawBody}`];
  return payloads.some((payload) => {
    const digest = createHmac('sha256', secret).update(payload).digest();
    return candidates.some((candidate) => safeEqual({ expected: digest, candidate }));
  });
}

function parseSignaturePart(part: string): { label: string | null; value: string } {
  const match = /^([a-z0-9_-]+)=(.+)$/i.exec(part);
  if (match && SIGNATURE_LABELS.includes(match[1].toLowerCase())) {
    return { label: match[1].toLowerCase(), value: match[2] };
  }
  return { label: null, value: part };
}

function safeEqual({ expected, candidate }: { expected: Buffer; candidate: string }): boolean {
  const decoded = /^[0-9a-f]+$/i.test(candidate) ? Buffer.from(candidate, 'hex') : Buffer.from(candidate, 'base64');
  return decoded.length === expected.length && timingSafeEqual(decoded, expected);
}

function readEventId(body: unknown): string | null {
  if (typeof body !== 'object' || body === null) {
    return null;
  }
  for (const key of ['id', 'event_id', 'delivery_id']) {
    if (key in body) {
      const value: unknown = Reflect.get(body, key);
      if (typeof value === 'string' || typeof value === 'number') {
        return String(value);
      }
    }
  }
  return null;
}

type StoredWebhook = { webhookId: string; secret: string };
type SeenEvent = { id: string; at: number };
