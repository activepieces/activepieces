import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { resendAuth } from '../..';
import { resendClient } from '../common/client';
import { listWebhooksOutputSchema } from '../output-schemas';

export const listWebhooks = createAction({
  name: 'list_webhooks',
  classification: 'SEARCH',
  auth: resendAuth,
  displayName: 'List Webhooks',
  outputSchema: listWebhooksOutputSchema,
  description: 'Retrieve all webhooks configured on your Resend account',
  audience: 'ai',
  aiMetadata: { description: "Retrieves every webhook configured on the account, including each one's endpoint URL, status, and subscribed events. Use this to discover a webhook ID or audit existing subscriptions. Read-only and idempotent.", idempotent: true },
  props: {},
  async run({ auth }) {
    const response = await resendClient.sendRequest<{
      data: { id: string; created_at: string; status: string; endpoint: string; events: string[] }[];
    }>({ auth: auth.secret_text, method: HttpMethod.GET, path: '/webhooks' });
    return response.data;
  },
});
