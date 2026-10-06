import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { huggingFaceAuth } from '../auth';
import { hfSettingsApi, hfWebhooks } from '../common/webhooks';
import { webhookOutputSchema } from '../output-schemas';

export const createWebhook = createAction({
  auth: huggingFaceAuth,
  name: 'create_webhook',
  classification: 'WRITE',
  displayName: 'Create Webhook',
  description: 'Create a Hugging Face webhook that calls an https URL when watched items change.',
  audience: 'ai',
  aiMetadata: {
    description:
      "Creates a user-level Hub webhook that POSTs an event to an https target URL (for example an Activepieces Catch Webhook URL) whenever a watched user, organization or repository changes: repository updates (commits, tags, settings) and/or discussion and pull-request activity. An optional secret is sent back in the X-Webhook-Secret header so the receiver can verify the call; it is never returned by any action. Needs a 'write' role token or a fine-grained token with webhook permission. Each call creates a new webhook, so a retry creates a duplicate; check List Webhooks first.",
    idempotent: false,
  },
  outputSchema: webhookOutputSchema,
  props: {
    url: Property.ShortText({
      displayName: 'Target URL',
      description: 'The https:// address the Hub will POST events to.',
      required: true,
    }),
    watched: hfWebhooks.watchedItemsProp({
      required: true,
      description: 'The users, organizations or repositories whose changes trigger the webhook. At least one.',
    }),
    domains: hfWebhooks.domainsProp({
      required: true,
      description: 'Which kinds of events to send: repository changes, discussion and pull-request activity, or both.',
    }),
    secret: Property.ShortText({
      displayName: 'Secret',
      description:
        'Optional shared secret, sent in the X-Webhook-Secret header of every delivery. Printable ASCII only. It cannot be read back later.',
      required: false,
    }),
  },
  async run(context) {
    const { url, watched, domains, secret } = context.propsValue;
    const watchedItems = hfWebhooks.parseWatched(watched);
    if (watchedItems.length === 0) {
      throw new Error('Provide at least one watched item.');
    }
    const domainList = hfWebhooks.parseDomains(domains);
    if (domainList.length === 0) {
      throw new Error("Provide at least one domain: 'repo', 'discussion' or both.");
    }
    const body: Record<string, unknown> = {
      url: hfWebhooks.assertHttpsUrl(url),
      watched: watchedItems,
      domains: domainList,
    };
    if (secret !== undefined && secret !== null && secret !== '') {
      body['secret'] = hfWebhooks.assertSecret(secret);
    }
    const response = await hfSettingsApi.request<unknown>({
      token: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/api/settings/webhooks',
      body,
    });
    return hfWebhooks.toOutput(hfWebhooks.unwrap(response.body));
  },
});
