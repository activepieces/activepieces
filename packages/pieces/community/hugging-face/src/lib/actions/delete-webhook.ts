import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { huggingFaceAuth } from '../auth';
import { hfSettingsApi, hfWebhooks } from '../common/webhooks';
import { deleteWebhookOutputSchema } from '../output-schemas';

export const deleteWebhook = createAction({
  auth: huggingFaceAuth,
  name: 'delete_webhook',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Webhook',
  description: 'Permanently delete a webhook from the connected Hugging Face account.',
  audience: 'ai',
  aiMetadata: {
    description:
      "Permanently deletes a webhook by its 24-character ID; the Hub stops calling its URL and the configuration, including any signing secret, is lost. To pause deliveries reversibly, prefer Enable or Disable Webhook. Find the ID with List Webhooks. Needs a 'write' role token or a fine-grained token with webhook permission. Cannot be undone, and a retry after success fails with 404.",
    idempotent: false,
  },
  outputSchema: deleteWebhookOutputSchema,
  props: {
    webhook_id: hfWebhooks.webhookIdProp(),
  },
  async run(context) {
    const webhookId = context.propsValue.webhook_id.trim();
    await hfSettingsApi.request<unknown>({
      token: context.auth.secret_text,
      method: HttpMethod.DELETE,
      path: hfWebhooks.path(webhookId),
    });
    return { deleted: true, webhook_id: webhookId };
  },
});
