import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { huggingFaceAuth } from '../auth';
import { hfSettingsApi, hfWebhooks } from '../common/webhooks';
import { updateWebhookOutputSchema } from '../output-schemas';

export const updateWebhook = createAction({
  auth: huggingFaceAuth,
  name: 'update_webhook',
  classification: 'WRITE',
  displayName: 'Update Webhook',
  description: 'Change the target URL, watched items, domains or secret of a Hugging Face webhook.',
  audience: 'ai',
  aiMetadata: {
    description:
      "Updates a webhook by its 24-character ID. It reads the current webhook first and changes only the fields you provide: Watched Items and Domains, when given, replace the whole existing list, so include every item to keep. The signing secret is sent only when you provide a new one; whether the Hub keeps an existing secret when it is omitted is not yet verified, so the result reports secret_status ('kept', 'replaced', 'set', 'cleared' or 'none') and a warning if it was cleared, in which case call again with the secret. Webhooks that run a Hub Job are refused. To pause deliveries use Enable or Disable Webhook. Needs a 'write' role token or a fine-grained token with webhook permission. Safe to retry with the same values.",
    idempotent: true,
  },
  outputSchema: updateWebhookOutputSchema,
  props: {
    webhook_id: hfWebhooks.webhookIdProp(),
    url: Property.ShortText({
      displayName: 'Target URL',
      description: 'New https:// address for deliveries. Leave empty to keep the current URL.',
      required: false,
    }),
    watched: hfWebhooks.watchedItemsProp({
      required: false,
      description:
        'Replaces the full list of watched users, organizations and repositories. Leave empty to keep the current list.',
    }),
    domains: hfWebhooks.domainsProp({
      required: false,
      description: 'Replaces the event domains. Leave empty to keep the current domains.',
    }),
    secret: Property.ShortText({
      displayName: 'New Secret',
      description:
        'A new shared secret for the X-Webhook-Secret header. Leave empty to not send one. Printable ASCII only.',
      required: false,
    }),
  },
  async run(context) {
    const { webhook_id, url, watched, domains, secret } = context.propsValue;
    const token = context.auth.secret_text;
    const newUrl = url !== undefined && url !== null && url.trim() !== '' ? hfWebhooks.assertHttpsUrl(url) : undefined;
    const newWatched = hfWebhooks.parseWatched(watched);
    const newDomains = hfWebhooks.parseDomains(domains);
    const newSecret = secret !== undefined && secret !== null && secret !== '' ? hfWebhooks.assertSecret(secret) : undefined;
    if (newUrl === undefined && newWatched.length === 0 && newDomains.length === 0 && newSecret === undefined) {
      throw new Error('Provide at least one field to change: Target URL, Watched Items, Domains or New Secret.');
    }
    const current = await hfWebhooks.fetch({ token, webhookId: webhook_id });
    const before = hfWebhooks.toOutput(current);
    if (before.runs_job) {
      throw new Error(
        'This webhook runs a Hugging Face Job instead of calling a URL. Updating Job webhooks is not supported by this action; edit it in the Hub settings.'
      );
    }
    const mergedUrl = newUrl ?? before.url;
    if (mergedUrl === null) {
      throw new Error('The webhook has no target URL. Provide Target URL.');
    }
    const body: Record<string, unknown> = {
      url: mergedUrl,
      watched: newWatched.length > 0 ? newWatched : hfWebhooks.existingWatched(current['watched']),
      domains: newDomains.length > 0 ? newDomains : before.domains,
    };
    if (newSecret !== undefined) {
      body['secret'] = newSecret;
    }
    const response = await hfSettingsApi.request<unknown>({
      token,
      method: HttpMethod.POST,
      path: hfWebhooks.path(webhook_id),
      body,
    });
    const after = hfWebhooks.toOutput(hfWebhooks.unwrap(response.body));
    const secretStatus = describeSecret({
      hadSecret: before.has_secret,
      hasSecret: after.has_secret,
      sentSecret: newSecret !== undefined,
    });
    return {
      ...after,
      secret_status: secretStatus,
      warning:
        secretStatus === 'cleared'
          ? 'The Hub removed the existing signing secret because none was sent. Call Update Webhook again with New Secret to restore it.'
          : null,
    };
  },
});

function describeSecret({ hadSecret, hasSecret, sentSecret }: DescribeSecretParams): SecretStatus {
  if (sentSecret) {
    return hadSecret ? 'replaced' : 'set';
  }
  if (hadSecret) {
    return hasSecret ? 'kept' : 'cleared';
  }
  return 'none';
}

type DescribeSecretParams = {
  hadSecret: boolean;
  hasSecret: boolean;
  sentSecret: boolean;
};

type SecretStatus = 'kept' | 'replaced' | 'set' | 'cleared' | 'none';
