import { createHmac, randomBytes, timingSafeEqual } from 'crypto';
import { HttpMethod } from '@activepieces/pieces-common';
import { createTrigger, TriggerStrategy, tryCatch } from '@activepieces/pieces-framework';
import { tinkoAuth } from '../auth';
import { TinkoApiError, TinkoItemResponse, tinkoClient } from './client';
import { TinkoEventEnvelope, tinkoEvents } from './events';
import { tinkoProps } from './props';

const STORE_KEY = 'tinko_webhook';

export function createTinkoWebhookTrigger({
  name,
  displayName,
  description,
  aiMetadata,
  events,
  filterChannelsOnServer,
  sampleData,
  mapEvent,
}: TinkoWebhookTriggerParams) {
  return createTrigger({
    auth: tinkoAuth,
    name,
    classification: 'READ',
    displayName,
    description,
    aiMetadata,
    props: {
      channels: tinkoProps.channelsMultiSelect({
        description: 'Listen only to events of these channels. Leave empty to listen to all channels.',
      }),
    },
    sampleData,
    type: TriggerStrategy.WEBHOOK,
    async onEnable(context) {
      const secret = randomBytes(32).toString('hex');
      const channels = context.propsValue.channels ?? [];
      const response = await tinkoClient.request<TinkoItemResponse<{ id?: string }>>({
        token: context.auth.secret_text,
        method: HttpMethod.POST,
        path: '/webhooks',
        body: {
          name: `Activepieces: ${displayName}`,
          url: context.webhookUrl,
          events,
          channels: filterChannelsOnServer ? channels : [],
          secret,
        },
      });
      const webhookId = response.data?.id;
      if (!webhookId) {
        throw new Error('Tinko did not return the ID of the created webhook');
      }
      await context.store.put<TinkoWebhookState>(STORE_KEY, { webhookId, secret });
    },
    async onDisable(context) {
      const state = await context.store.get<TinkoWebhookState>(STORE_KEY);
      if (!state) {
        return;
      }
      const result = await tryCatch(() =>
        tinkoClient.request<unknown>({
          token: context.auth.secret_text,
          method: HttpMethod.DELETE,
          path: tinkoClient.pathFor('webhooks', state.webhookId),
        })
      );
      if (result.error && !(result.error instanceof TinkoApiError && result.error.status === 404)) {
        throw result.error;
      }
      await context.store.delete(STORE_KEY);
    },
    async run(context) {
      const state = await context.store.get<TinkoWebhookState>(STORE_KEY);
      if (
        !state ||
        !isSignatureValid({
          secret: state.secret,
          headers: context.payload.headers,
          rawBody: context.payload.rawBody,
          body: context.payload.body,
        })
      ) {
        return [];
      }
      const envelope = tinkoEvents.parseEnvelope(context.payload.body);
      if (!envelope || !events.some((event) => event === envelope.event)) {
        return [];
      }
      const channels = context.propsValue.channels ?? [];
      const channelId = tinkoEvents.channelIdOf(envelope.data);
      if (channels.length > 0 && channelId !== undefined && !channels.includes(channelId)) {
        return [];
      }
      return [mapEvent(envelope)];
    },
  });
}

function isSignatureValid({
  secret,
  headers,
  rawBody,
  body,
}: {
  secret: string;
  headers: Record<string, string>;
  rawBody: unknown;
  body: unknown;
}): boolean {
  const timestamp = header({ headers, name: 'x-webhook-timestamp' });
  const signature = header({ headers, name: 'x-webhook-signature' });
  if (!timestamp || !signature) {
    return false;
  }
  const payload = rawPayload({ rawBody, body });
  const expected = Buffer.from(
    createHmac('sha256', secret).update(`${timestamp}.${payload}`, 'utf8').digest('hex'),
    'utf8'
  );
  const received = Buffer.from(signature.trim().toLowerCase(), 'utf8');
  return expected.length === received.length && timingSafeEqual(expected, received);
}

function rawPayload({ rawBody, body }: { rawBody: unknown; body: unknown }): string {
  if (typeof rawBody === 'string') {
    return rawBody;
  }
  if (Buffer.isBuffer(rawBody)) {
    return rawBody.toString('utf8');
  }
  return JSON.stringify(body);
}

function header({
  headers,
  name,
}: {
  headers: Record<string, string>;
  name: string;
}): string | undefined {
  const match = Object.entries(headers ?? {}).find(([key]) => key.toLowerCase() === name);
  return match ? String(match[1]) : undefined;
}

type TinkoWebhookState = {
  webhookId: string;
  secret: string;
};

type TinkoWebhookTriggerParams = {
  name: string;
  displayName: string;
  description: string;
  aiMetadata: { description: string };
  events: TinkoEventName[];
  filterChannelsOnServer: boolean;
  sampleData: Record<string, unknown>;
  mapEvent: (envelope: TinkoEventEnvelope) => Record<string, unknown>;
};

export type TinkoEventName =
  | 'MESSAGE_RECEIVED'
  | 'MESSAGE_SENT'
  | 'CHAT_CREATED'
  | 'CHAT_ENDED'
  | 'CHAT_TRANSFERRED'
  | 'CHANNEL_CONNECTED'
  | 'CHANNEL_DISCONNECTED';
