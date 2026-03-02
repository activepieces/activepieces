import { HttpMethod } from '@activepieces/pieces-common';
import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { buttondownAuth } from './auth';
import { buttondownRequest } from './client';
import { ButtondownWebhook, ButtondownWebhookEvent } from './types';

export interface ButtondownWebhookPayload {
  event_type?: string;
  data?: Record<string, unknown>;
  [key: string]: unknown;
}

interface CreateButtondownWebhookTriggerParams {
  name: string;
  displayName: string;
  description: string;
  eventType: ButtondownWebhookEvent;
  sampleData: unknown;
  enrich?: (params: {
    apiKey: string;
    payload: ButtondownWebhookPayload;
  }) => Promise<Record<string, unknown>>;
}

export const createButtondownWebhookTrigger = ({
  name,
  displayName,
  description,
  eventType,
  sampleData,
  enrich,
}: CreateButtondownWebhookTriggerParams) =>
  createTrigger({
    auth: buttondownAuth,
    name,
    displayName,
    description,
    type: TriggerStrategy.WEBHOOK,
    props: {
      description: Property.ShortText({
        displayName: 'Webhook Description',
        description: 'Optional description stored with the webhook in Buttondown.',
        required: false,
      }),
      signingKey: Property.ShortText({
        displayName: 'Webhook Signing Key',
        description: 'Optional HMAC signing key to validate webhook requests.',
        required: false,
      }),
    },
    sampleData,
    async onEnable(context) {
      if (!context.auth?.secret_text) {
        throw new Error('Authentication is required. Connect your Buttondown account.');
      }

      const webhook = await buttondownRequest<ButtondownWebhook>({
        auth: context.auth.secret_text,
        method: HttpMethod.POST,
        path: '/webhooks',
        body: {
          url: context.webhookUrl,
          event_types: [eventType],
          description: context.propsValue.description,
          signing_key: context.propsValue.signingKey,
        },
      });

      await context.store.put('webhookId', webhook.id);
    },
    async onDisable(context) {
      const webhookId = await context.store.get<string>('webhookId');
      if (!webhookId || !context.auth?.secret_text) {
        return;
      }

      await buttondownRequest<void>({
        auth: context.auth.secret_text,
        method: HttpMethod.DELETE,
        path: `/webhooks/${webhookId}`,
      });
    },
    async run(context) {
      const payload = context.payload.body as ButtondownWebhookPayload;
      if (payload?.event_type !== eventType) {
        return [];
      }

      let enriched: Record<string, unknown> | undefined;
      if (enrich && context.auth?.secret_text) {
        enriched = await enrich({
          apiKey: context.auth.secret_text,
          payload,
        });
      }

      return [
        {
          ...payload,
          ...(enriched ?? {}),
        },
      ];
    },
  });
