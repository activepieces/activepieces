import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { sendrAuth } from '../auth';
import { sendrApiCall } from '../common';

export const listWebhooks = createAction({
  auth: sendrAuth,
  name: 'list_webhooks',
  displayName: 'List Webhooks',
  description: 'Lists all registered webhooks in your Sendr workspace.',
  props: {},
  async run(context) {
    const response = await sendrApiCall<{
      webhooks: { url: string; name?: string; events?: string[]; enabled?: boolean; [key: string]: unknown }[];
    }>({
      token: context.auth as unknown as string,
      method: HttpMethod.GET,
      path: '/webhook',
    });
    const webhooks = response.body?.webhooks ?? [];
    return webhooks.map((w) => ({
      url: w.url,
      name: w.name ?? null,
      events: Array.isArray(w.events) ? w.events.join(', ') : null,
      enabled: w.enabled ?? null,
    }));
  },
});
