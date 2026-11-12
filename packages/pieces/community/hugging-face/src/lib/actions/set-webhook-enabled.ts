import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { huggingFaceAuth } from '../auth';
import { hfSettingsApi, hfWebhooks } from '../common/webhooks';
import { webhookOutputSchema } from '../output-schemas';

export const setWebhookEnabled = createAction({
  auth: huggingFaceAuth,
  name: 'set_webhook_enabled',
  classification: 'WRITE',
  displayName: 'Enable or Disable Webhook',
  description: 'Turn a Hugging Face webhook on or off without deleting it.',
  audience: 'ai',
  aiMetadata: {
    description:
      "Enables or disables a webhook by its 24-character ID without changing its configuration: a disabled webhook keeps its URL, watched items and secret but receives no deliveries. Use it to pause or resume a webhook, including one the Hub suspended after repeated failures; prefer it over Delete Webhook. Find the ID with List Webhooks. Needs a 'write' role token or a fine-grained token with webhook permission. Safe to retry: setting the same state again converges.",
    idempotent: true,
  },
  outputSchema: webhookOutputSchema,
  props: {
    webhook_id: hfWebhooks.webhookIdProp(),
    enabled: Property.Checkbox({
      displayName: 'Enabled',
      description: 'Checked to enable the webhook, unchecked to disable it.',
      required: true,
      defaultValue: true,
    }),
  },
  async run(context) {
    const { webhook_id, enabled } = context.propsValue;
    const response = await hfSettingsApi.request<unknown>({
      token: context.auth.secret_text,
      method: HttpMethod.POST,
      path: `${hfWebhooks.path(webhook_id)}/${enabled === false ? 'disable' : 'enable'}`,
    });
    return hfWebhooks.toOutput(hfWebhooks.unwrap(response.body));
  },
});
