import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { huggingFaceAuth } from '../auth';
import { hfSettingsApi, hfWebhooks } from '../common/webhooks';
import { listWebhooksOutputSchema } from '../output-schemas';

export const listWebhooks = createAction({
  auth: huggingFaceAuth,
  name: 'list_webhooks',
  classification: 'SEARCH',
  displayName: 'List Webhooks',
  description: 'List the webhooks configured on the connected Hugging Face account.',
  audience: 'ai',
  aiMetadata: {
    description:
      "Lists every webhook on the connected account's Hub settings: ID, target URL, whether it is enabled (or why it is disabled), the watched users, organizations and repositories, the event domains and whether a signing secret is set. The secret itself is never returned. Use it to find a webhook ID for Get, Update, Enable or Disable, or Delete Webhook. Needs a 'write' role token or a fine-grained token with webhook permission. Read-only and safe to retry.",
    idempotent: true,
  },
  outputSchema: listWebhooksOutputSchema,
  props: {},
  async run(context) {
    const response = await hfSettingsApi.request<unknown>({
      token: context.auth.secret_text,
      method: HttpMethod.GET,
      path: '/api/settings/webhooks',
    });
    const webhooks = Array.isArray(response.body) ? response.body.map(hfWebhooks.toOutput) : [];
    return { webhooks, count: webhooks.length };
  },
});
