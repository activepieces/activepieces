import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { sendrAuth } from '../auth';
import { webhookDropdown, sendrApiCall, flattenObject } from '../common';

export const revealWebhookSecret = createAction({
  auth: sendrAuth,
  name: 'reveal_webhook_secret',
  displayName: 'Reveal Webhook Secret',
  description: 'Reveals the secret key for a registered webhook so you can verify incoming signatures.',
  props: {
    webhook: webhookDropdown,
  },
  async run(context) {
    const response = await sendrApiCall<Record<string, unknown>>({
      token: context.auth as unknown as string,
      method: HttpMethod.POST,
      path: '/webhook/reveal-secret',
      body: { url: context.propsValue.webhook },
    });
    return flattenObject(response.body);
  },
});
