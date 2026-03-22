import {
  createTrigger,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, HttpRequest } from '@activepieces/pieces-common';
import { dubAuth, DUB_API_BASE } from '../auth';
import { verifyDubSignature } from '../common';

interface DubWebhookCreateResponse {
  id: string;
  name: string;
  url: string;
  secret: string;
  triggers: string[];
}

export const linkCreated = createTrigger({
  auth: dubAuth,
  name: 'link_created',
  displayName: 'Link Created',
  description: 'Triggers in real time whenever a new short link is created in your Dub workspace.',
  type: TriggerStrategy.WEBHOOK,
  props: {},
  sampleData: {
    id: 'evt_def456',
    event: 'link.created',
    createdAt: '2024-01-15T10:30:00.000Z',
    data: {
      link: {
        id: 'clv3g2xyz',
        domain: 'dub.sh',
        key: 'new-link',
        url: 'https://example.com/new-page',
        shortLink: 'https://dub.sh/new-link',
        clicks: 0,
        createdAt: '2024-01-15T10:30:00.000Z',
      },
    },
  },
  async onEnable(context) {
    const webhookName = `Activepieces — Link Created (${Date.now()})`;

    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `${DUB_API_BASE}/webhooks`,
      headers: {
        Authorization: `Bearer ${context.auth}`,
        'Content-Type': 'application/json',
      },
      body: {
        name: webhookName,
        url: context.webhookUrl,
        triggers: ['link.created'],
      },
    };

    const response = await httpClient.sendRequest<DubWebhookCreateResponse>(request);

    await context.store.put<{ id: string; secret: string }>('dub_webhook_link_created', {
      id: response.body.id,
      secret: response.body.secret,
    });
  },
  async onDisable(context) {
    const stored = await context.store.get<{ id: string; secret: string }>('dub_webhook_link_created');

    if (stored?.id) {
      await httpClient.sendRequest({
        method: HttpMethod.DELETE,
        url: `${DUB_API_BASE}/webhooks/${stored.id}`,
        headers: {
          Authorization: `Bearer ${context.auth}`,
          'Content-Type': 'application/json',
        },
      });
    }
  },
  async run(context) {
    const stored = await context.store.get<{ id: string; secret: string }>('dub_webhook_link_created');
    const secret = stored?.secret;

    const signatureHeader =
      (context.payload.headers['x-dub-signature'] as string) ||
      (context.payload.headers['dub-signature'] as string) ||
      '';

    // Reject requests missing a signature header when we have a secret
    if (secret && !signatureHeader) {
      return [];
    }

    // Reject requests with an invalid signature
    if (secret && !verifyDubSignature(secret, context.payload.rawBody as string, signatureHeader)) {
      return [];
    }

    return [context.payload.body];
  },
});
