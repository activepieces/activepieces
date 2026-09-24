import { createAction } from '@activepieces/pieces-framework';
import { huggingFaceAuth } from '../auth';
import { hfWebhooks } from '../common/webhooks';
import { webhookOutputSchema } from '../output-schemas';

export const getWebhook = createAction({
  auth: huggingFaceAuth,
  name: 'get_webhook',
  classification: 'READ',
  displayName: 'Get Webhook',
  description: 'Get one webhook of the connected Hugging Face account.',
  audience: 'ai',
  aiMetadata: {
    description:
      "Returns one webhook by its 24-character ID: target URL, enabled state (or why it is disabled), watched users, organizations and repositories, event domains, whether a signing secret is set and when it last fired. The secret itself is never returned. Find the ID with List Webhooks. Needs a 'write' role token or a fine-grained token with webhook permission. Read-only and safe to retry.",
    idempotent: true,
  },
  outputSchema: webhookOutputSchema,
  props: {
    webhook_id: hfWebhooks.webhookIdProp(),
  },
  async run(context) {
    const webhook = await hfWebhooks.fetch({
      token: context.auth.secret_text,
      webhookId: context.propsValue.webhook_id,
    });
    return hfWebhooks.toOutput(webhook);
  },
});
