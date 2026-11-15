import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { resendAuth } from '../..';
import { resendClient } from '../common/client';
import { resendProps } from '../common/props';
import { deleteWebhookOutputSchema } from '../output-schemas';

export const deleteWebhook = createAction({
  name: 'delete_webhook',
  classification: 'DESTRUCTIVE',
  auth: resendAuth,
  displayName: 'Delete Webhook',
  outputSchema: deleteWebhookOutputSchema,
  description: 'Permanently remove a webhook subscription',
  audience: 'ai',
  aiMetadata: { description: 'Permanently deletes a webhook, identified by ID, stopping all further event deliveries to its endpoint. Effectively idempotent — once deleted, repeating the call has no further effect.', idempotent: true },
  props: {
    webhook_id: resendProps.webhookId,
  },
  async run({ auth, propsValue }) {
    return await resendClient.sendRequest<{ object: string; id: string; deleted: boolean }>({ auth: auth.secret_text, method: HttpMethod.DELETE, path: `/webhooks/${propsValue.webhook_id}` });
  },
});
