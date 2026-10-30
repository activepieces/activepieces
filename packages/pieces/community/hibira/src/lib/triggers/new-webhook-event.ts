import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { hibiraAuth } from '../auth';
import { hibiraClient } from '../common/client';
import { hmacHex, signatureMatches } from '../common/signature';

const EVENTS = [
  { label: 'Channel Occupied (first subscriber joined)', value: 'channel_occupied' },
  { label: 'Channel Vacated (last subscriber left)', value: 'channel_vacated' },
  { label: 'Member Added (presence)', value: 'member_added' },
  { label: 'Member Removed (presence)', value: 'member_removed' },
  { label: 'Client Event', value: 'client_event' },
  { label: 'Subscription Count Changed', value: 'subscription_count' },
  { label: 'Cache Miss', value: 'cache_miss' },
  { label: 'Chat Message', value: 'chat_message' },
];

type WebhookBody = { time_ms?: number; events?: Array<Record<string, unknown>> };

/** The exact bytes Hibira signed: the raw body when the platform keeps it. */
export function bodyBytes(payload: { rawBody?: unknown; body: unknown }): string | Buffer {
  const raw = payload.rawBody;
  if (Buffer.isBuffer(raw) || typeof raw === 'string') {
    return raw;
  }
  return typeof payload.body === 'string' ? payload.body : JSON.stringify(payload.body);
}

/**
 * Hibira signs webhooks with the app secret like Pusher: X-Pusher-Key and an
 * HMAC-SHA256 of the body in X-Pusher-Signature. While a secret is being
 * rotated, X-Hibira-Previous-Signature carries the HMAC made with the old one.
 */
export function webhookVerified(secret: string, key: string, headers: Record<string, string>, body: string | Buffer): boolean {
  const h = Object.fromEntries(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v]));
  if (h['x-pusher-key'] !== key) {
    return false;
  }
  const expected = hmacHex(secret, body);
  return signatureMatches(expected, h['x-pusher-signature']) || signatureMatches(expected, h['x-hibira-previous-signature']);
}

export const newWebhookEvent = createTrigger({
  auth: hibiraAuth,
  name: 'new_webhook_event',
  displayName: 'New Channel Event',
  description: 'Starts the flow when a channel is occupied or vacated, a presence member joins or leaves, a client sends an event, and more.',
  classification: 'READ',
  aiMetadata: {
    description:
      'Fires for Hibira app webhooks: channel occupied/vacated, presence member added/removed, client events, subscription count changes, cache misses and chat messages. One item per event; registers and removes its own webhook on the app.',
  },
  props: {
    events: Property.StaticMultiSelectDropdown({
      displayName: 'Events',
      required: true,
      defaultValue: ['channel_occupied', 'channel_vacated'],
      options: { options: EVENTS },
    }),
    channelPrefix: Property.ShortText({
      displayName: 'Channel Prefix',
      description: 'Only events of channels whose name starts with this text, for example presence-.',
      required: false,
    }),
  },
  type: TriggerStrategy.WEBHOOK,
  sampleData: {
    name: 'member_added',
    channel: 'presence-lobby',
    user_id: 'user-42',
    time_ms: 1761811200000,
  },
  async onEnable(context) {
    await hibiraClient.channels(context.auth, {
      method: 'POST',
      path: '/webhooks',
      body: { url: context.webhookUrl, events: context.propsValue.events },
    });
  },
  async onDisable(context) {
    try {
      await hibiraClient.channels(context.auth, {
        method: 'DELETE',
        path: '/webhooks',
        query: { url: context.webhookUrl },
      });
    } catch (error) {
      // Already removed on hibira.io: nothing left to clean up.
      if ((error as { response?: { status?: number } }).response?.status !== 404) {
        throw error;
      }
    }
  },
  async run(context) {
    const auth = context.auth.props;
    if (!webhookVerified(auth.secret, auth.key, context.payload.headers, bodyBytes(context.payload))) {
      return [];
    }
    const body = (typeof context.payload.body === 'string'
      ? JSON.parse(context.payload.body)
      : context.payload.body) as WebhookBody;
    const wanted = (context.propsValue.events ?? []) as string[];
    const prefix = context.propsValue.channelPrefix ?? '';
    return (body.events ?? [])
      .filter((e) => wanted.includes(String(e['name'])) && String(e['channel'] ?? '').startsWith(prefix))
      .map((e) => ({ ...e, time_ms: body.time_ms }));
  },
});
