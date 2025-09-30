import { HttpMethod } from '@activepieces/pieces-common';
import { Property, TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { createHmac, timingSafeEqual } from 'crypto';
import { hedyAuth } from '../../auth';
import { HedyApiClient, unwrapResource } from '../../common/client';
import { HedyWebhookEvent, WebhookRegistration } from '../../common/types';

interface TriggerConfig {
  event: HedyWebhookEvent;
  name: string;
  displayName: string;
  description: string;
  sampleData?: unknown;
}

export function createHedyWebhookTrigger(config: TriggerConfig) {
  return createTrigger({
    auth: hedyAuth,
    name: config.name,
    displayName: config.displayName,
    description: config.description,
    type: TriggerStrategy.WEBHOOK,
    props: {
      verifySignature: Property.Checkbox({
        displayName: 'Verify Signature',
        description:
          'Verify the webhook signature using the secret returned by Hedy. Disable this option if Hedy does not provide a signing secret for your account.',
        required: false,
        defaultValue: false,
      }),
    },
    sampleData: config.sampleData,
    async onEnable(context) {
      const client = new HedyApiClient(context.auth as string);
      const webhookUrl = context.webhookUrl;

      if (!webhookUrl) {
        throw new Error('Webhook URL is unavailable. Please try again.');
      }

      const response = await client.request<WebhookRegistration>({
        method: HttpMethod.POST,
        path: '/webhooks',
        body: {
          url: webhookUrl,
          events: [config.event],
        },
      });

      const webhook = unwrapResource<WebhookRegistration>(response);

      if (!webhook?.id) {
        throw new Error('Failed to register webhook with Hedy. No webhook ID was returned.');
      }

      await context.store.put('webhookId', webhook.id);

      if (webhook.signingSecret) {
        await context.store.put('signingSecret', webhook.signingSecret);
      } else {
        await context.store.delete('signingSecret');
      }
    },
    async onDisable(context) {
      const webhookId = (await context.store.get<string>('webhookId')) ?? undefined;
      if (!webhookId) {
        return;
      }

      const client = new HedyApiClient(context.auth as string);
      try {
        await client.request({
          method: HttpMethod.DELETE,
          path: `/webhooks/${webhookId}`,
        });
      } catch (error) {
        // Ignore deletion errors – webhook may already be removed.
      } finally {
        await context.store.delete('webhookId');
        await context.store.delete('signingSecret');
      }
    },
    async run(context) {
      const props = context.propsValue as Record<string, unknown>;
      const verifySignatureEnabled = Boolean(props['verifySignature']);
      const payload = (context.payload.body ?? {}) as Record<string, unknown>;

      if (verifySignatureEnabled) {
        const signatureHeader = getSignatureHeader(context.payload.headers ?? {});
        if (!signatureHeader) {
          throw new Error('Hedy signature header is missing from the webhook request.');
        }

        const signingSecret = await context.store.get<string>('signingSecret');
        if (!signingSecret) {
          throw new Error(
            'Hedy did not return a signing secret during webhook registration. Disable signature verification or re-register your webhook.',
          );
        }

        const rawBody = extractRawBody(context.payload.rawBody as RawBody, payload);
        const expectedSignature = createHmac('sha256', signingSecret).update(rawBody).digest('hex');

        if (!secureCompare(expectedSignature, signatureHeader)) {
          throw new Error('Webhook signature verification failed. This request may not be from Hedy.');
        }
      }

      const eventType = payload['event'] as string | undefined;
      if (eventType && eventType !== config.event) {
        return [];
      }

      return [payload];
    },
  });
}

type HeadersMap = Record<string, string | string[] | undefined>;

type RawBody = string | Buffer | undefined;

function getSignatureHeader(headers: HeadersMap): string | undefined {
  const normalized: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    if (typeof value === 'string') {
      normalized[key.toLowerCase()] = value;
    } else if (Array.isArray(value) && value.length > 0) {
      normalized[key.toLowerCase()] = value[0];
    }
  }

  return normalized['x-hedy-signature'];
}

function extractRawBody(rawBody: RawBody, payload: Record<string, unknown>): Buffer {
  if (typeof rawBody === 'string') {
    return Buffer.from(rawBody, 'utf8');
  }

  if (rawBody instanceof Buffer) {
    return rawBody;
  }

  return Buffer.from(JSON.stringify(payload ?? {}), 'utf8');
}

function secureCompare(expected: string, candidate: string): boolean {
  const expectedBuffer = Buffer.from(expected, 'hex');
  const candidateBuffer = Buffer.from(candidate, 'hex');

  if (expectedBuffer.length !== candidateBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, candidateBuffer);
}
