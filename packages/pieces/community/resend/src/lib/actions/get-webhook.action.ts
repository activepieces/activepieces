import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { resendAuth } from '../..';
import { resendClient } from '../common/client';
import { resendProps } from '../common/props';
import { getWebhookOutputSchema } from '../output-schemas';

export const getWebhook = createAction({
  name: 'get_webhook',
  classification: 'READ',
  auth: resendAuth,
  displayName: 'Get Webhook',
  outputSchema: getWebhookOutputSchema,
  description: 'Retrieve a single webhook by its ID',
  audience: 'ai',
  aiMetadata: { description: 'Retrieves the endpoint URL, status, and subscribed event types of a single webhook by its ID. Use List Webhooks to find the ID. Read-only and idempotent.', idempotent: true },
  props: {
    webhook_id: resendProps.webhookId,
  },
  async run({ auth, propsValue }) {
    return await resendClient.sendRequest({ auth: auth.secret_text, method: HttpMethod.GET, path: `/webhooks/${propsValue.webhook_id}` });
  },
});
