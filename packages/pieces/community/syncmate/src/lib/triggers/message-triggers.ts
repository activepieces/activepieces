import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { syncmateAuth } from '../auth';
import { syncmateRequest } from '../common/client';
import { syncmateProps } from '../common/props';
import { header, verifyEvent } from '../common/signature';

const STORE_KEY = 'syncmate_subscription';

type StoredSubscription = { id: string; secret: string };
type ApiEnvelope<T> = { data?: T };

const SAMPLE = {
  id: 'evt_3f9c1a7e2b5d4c18',
  event: 'message.received',
  occurred_at: '2026-11-18T09:30:00Z',
  message: {
    id: '3EB0C431D8F6A2B7E9',
    direction: 'incoming',
    type: 'text',
    text: 'Hi, is my order shipped?',
    caption: null,
    media_url: null,
    status: 'received',
    error: null,
  },
  contact: { phone: '919876543210', name: 'Asha' },
  connection: { id: 93, mode: 'standard', number: '919928044051', name: 'Sales' },
  subscription_id: '6704f0aa0000000000000001',
};

/** The event in a delivery, or nothing when it is not a genuine Assistro delivery. */
export function acceptDelivery(input: {
  stored: StoredSubscription | null;
  body: unknown;
  rawBody: unknown;
  headers: Record<string, unknown> | undefined;
  expectedEvent: string;
  nowSeconds?: number;
}): unknown[] {
  const { stored, body } = input;
  if (!stored || !body || typeof body !== 'object') return [];

  const rawBody = typeof input.rawBody === 'string' ? input.rawBody : Buffer.isBuffer(input.rawBody) ? input.rawBody.toString('utf8') : JSON.stringify(body);
  const valid = verifyEvent({
    secret: stored.secret,
    rawBody,
    timestamp: header(input.headers, 'x-assistro-timestamp'),
    signature: header(input.headers, 'x-assistro-signature'),
    nowSeconds: input.nowSeconds,
  });
  if (!valid) return [];

  return (body as Record<string, unknown>)['event'] === input.expectedEvent ? [body] : [];
}

function messageTrigger(config: {
  name: string;
  displayName: string;
  description: string;
  event: 'message.received' | 'message.sent' | 'message.status';
  withStatuses?: boolean;
}) {
  const props = {
    connection: syncmateProps.connection,
    mode: Property.StaticDropdown({
      displayName: 'Number Type',
      description: 'Listen to QR-connected numbers, Meta Cloud API numbers, or both.',
      required: false,
      defaultValue: 'all',
      options: {
        options: [
          { label: 'Both', value: 'all' },
          { label: 'QR-connected (standard) only', value: 'standard' },
          { label: 'Meta Cloud API only', value: 'meta' },
        ],
      },
    }),
    ...(config.withStatuses
      ? {
          statuses: Property.StaticMultiSelectDropdown({
            displayName: 'Statuses',
            description: 'Start the flow only for these statuses. Leave empty for all.',
            required: false,
            options: {
              options: [
                { label: 'Sent', value: 'sent' },
                { label: 'Delivered', value: 'delivered' },
                { label: 'Read', value: 'read' },
                { label: 'Failed', value: 'failed' },
              ],
            },
          }),
        }
      : {}),
  };

  const sampleData = {
    ...SAMPLE,
    event: config.event,
    message: {
      ...SAMPLE.message,
      ...(config.event === 'message.received'
        ? {}
        : { direction: 'outgoing', status: config.event === 'message.status' ? 'delivered' : 'sent' }),
    },
  };

  return createTrigger({
    auth: syncmateAuth,
    name: config.name,
    displayName: config.displayName,
    description: config.description,
    type: TriggerStrategy.WEBHOOK,
    props,
    sampleData,

    async onEnable(context) {
      const values = context.propsValue as Record<string, unknown>;
      const body: Record<string, unknown> = {
        target_url: context.webhookUrl,
        event: config.event,
      };
      if (values['connection']) body['connection_id'] = Number(values['connection']);
      if (Array.isArray(values['statuses']) && values['statuses'].length) body['statuses'] = values['statuses'];
      if (values['mode'] === 'meta' || values['mode'] === 'standard') body['mode'] = values['mode'];

      const response = await syncmateRequest<ApiEnvelope<{ id?: string; secret?: string }>>({
        auth: context.auth,
        method: HttpMethod.POST,
        path: '/v1/activepieces/events/subscriptions',
        body,
      });
      const id = response?.data?.id;
      const secret = response?.data?.secret;
      if (!id || !secret) {
        throw new Error('SyncMate did not return a subscription for this trigger.');
      }
      await context.store.put<StoredSubscription>(STORE_KEY, { id, secret });
    },

    async onDisable(context) {
      const stored = await context.store.get<StoredSubscription>(STORE_KEY);
      if (!stored?.id) return;
      try {
        await syncmateRequest({
          auth: context.auth,
          method: HttpMethod.DELETE,
          path: `/v1/activepieces/events/subscriptions/${encodeURIComponent(stored.id)}`,
        });
      } catch (e) {
        // Already gone on SyncMate's side: nothing left to clean up.
        if (!(e instanceof Error && e.message.startsWith('Not found'))) throw e;
      }
      await context.store.delete(STORE_KEY);
    },

    async test(context) {
      const values = context.propsValue as Record<string, unknown>;
      const queryParams: Record<string, string> = { event: config.event };
      if (values['connection']) queryParams['connection_id'] = String(values['connection']);
      if (values['mode'] === 'meta' || values['mode'] === 'standard') queryParams['mode'] = String(values['mode']);
      if (Array.isArray(values['statuses']) && values['statuses'].length) queryParams['statuses'] = values['statuses'].join(',');
      const response = await syncmateRequest<ApiEnvelope<unknown[]>>({
        auth: context.auth,
        method: HttpMethod.GET,
        path: '/v1/activepieces/events/sample',
        queryParams,
      });
      return Array.isArray(response?.data) && response.data.length ? response.data : [sampleData];
    },

    async run(context) {
      return acceptDelivery({
        stored: await context.store.get<StoredSubscription>(STORE_KEY),
        body: context.payload.body,
        rawBody: (context.payload as { rawBody?: unknown }).rawBody,
        headers: context.payload.headers as Record<string, unknown>,
        expectedEvent: config.event,
      });
    },
  });
}

export const newMessageReceivedTrigger = messageTrigger({
  name: 'newMessageReceived',
  displayName: 'New Message Received',
  description: 'Starts when a customer sends a WhatsApp message to your number (QR-connected or Meta Cloud API).',
  event: 'message.received',
});

export const newOutgoingMessageTrigger = messageTrigger({
  name: 'newOutgoingMessage',
  displayName: 'New Outgoing Message',
  description: 'Starts when your number sends a WhatsApp message, e.g. a reply typed on the phone.',
  event: 'message.sent',
});

export const messageStatusUpdatedTrigger = messageTrigger({
  name: 'messageStatusUpdated',
  displayName: 'Message Status Updated',
  description: 'Starts when a message you sent is delivered, read or fails.',
  event: 'message.status',
  withStatuses: true,
});
