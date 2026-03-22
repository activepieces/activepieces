import {
  createTrigger,
  TriggerStrategy,
  Property,
} from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, HttpRequest } from '@activepieces/pieces-common';
import { dubAuth, DUB_API_BASE } from '../auth';

interface DubWebhook {
  id: string;
  name: string;
  url: string;
  secret: string;
  triggers: string[];
  linkIds: string[] | null;
}

interface DubWebhookCreateResponse {
  id: string;
  name: string;
  url: string;
  secret: string;
  triggers: string[];
}

export const linkClicked = createTrigger({
  auth: dubAuth,
  name: 'link_clicked',
  displayName: 'Link Clicked',
  description:
    'Triggers in real time whenever one of your Dub short links is clicked. Optionally filter by a specific link.',
  type: TriggerStrategy.WEBHOOK,
  props: {
    linkId: Property.ShortText({
      displayName: 'Link ID (optional)',
      description:
        'Restrict this trigger to clicks on a specific link. Leave blank to trigger on any link click in your workspace.',
      required: false,
    }),
  },
  sampleData: {
    id: 'evt_abc123',
    event: 'link.clicked',
    createdAt: '2024-01-15T10:30:00.000Z',
    data: {
      link: {
        id: 'clv3g2xyz',
        domain: 'dub.sh',
        key: 'my-promo',
        url: 'https://example.com/landing',
        shortLink: 'https://dub.sh/my-promo',
        clicks: 42,
      },
      click: {
        id: 'click_abc',
        timestamp: '2024-01-15T10:30:00.000Z',
        identity: 'anonymous',
        url: 'https://dub.sh/my-promo',
        country: 'US',
        city: 'San Francisco',
        region: 'CA',
        continent: 'NA',
        device: 'Desktop',
        browser: 'Chrome',
        os: 'macOS',
        referer: 'https://twitter.com',
        refererUrl: 'https://twitter.com',
      },
    },
  },
  async onEnable(context) {
    const webhookName = `Activepieces — Link Clicked (${Date.now()})`;

    const body: Record<string, unknown> = {
      name: webhookName,
      url: context.webhookUrl,
      triggers: ['link.clicked'],
    };

    // Optional: restrict to a specific link
    if (context.propsValue.linkId) {
      body['linkIds'] = [context.propsValue.linkId];
    }

    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `${DUB_API_BASE}/webhooks`,
      headers: {
        Authorization: `Bearer ${context.auth}`,
        'Content-Type': 'application/json',
      },
      body,
    };

    const response = await httpClient.sendRequest<DubWebhookCreateResponse>(request);

    // Persist webhook ID so we can delete it on disable
    await context.store.put<{ id: string }>('dub_webhook_link_clicked', {
      id: response.body.id,
    });
  },
  async onDisable(context) {
    const stored = await context.store.get<{ id: string }>('dub_webhook_link_clicked');

    if (stored?.id) {
      const request: HttpRequest = {
        method: HttpMethod.DELETE,
        url: `${DUB_API_BASE}/webhooks/${stored.id}`,
        headers: {
          Authorization: `Bearer ${context.auth}`,
          'Content-Type': 'application/json',
        },
      };

      await httpClient.sendRequest(request);
    }
  },
  async run(context) {
    // Dub sends the full event payload in the request body
    return [context.payload.body];
  },
});
