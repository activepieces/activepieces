import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { convertkitAuth } from '../../auth';
import { kitClient } from '../../common/client';
import { kitListWebhooksOutputSchema } from '../../output-schemas';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const rulesOf = (body: unknown): unknown[] => {
  if (Array.isArray(body)) {
    return body;
  }
  if (isRecord(body) && Array.isArray(body['rules'])) {
    return body['rules'];
  }
  return [];
};

export const kitListWebhooks = createAction({
  auth: convertkitAuth,
  name: 'kit_list_webhooks',
  classification: 'SEARCH',
  outputSchema: kitListWebhooksOutputSchema,
  displayName: 'List Webhooks',
  description: 'List the webhook automations registered on the Kit account.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the webhook rules registered on the account, each with its rule ID, event and target URL. Use it to find a rule ID before Delete Webhook or to avoid registering a duplicate with Create Webhook.',
    idempotent: true,
  },
  props: {},
  async run(context) {
    const response = await kitClient.request<unknown>({
      apiSecret: context.auth.secret_text,
      method: HttpMethod.GET,
      path: '/automations/hooks',
    });
    const body = response.body;
    const rules = rulesOf(body);
    return {
      rules: rules.map((item) =>
        isRecord(item) && 'rule' in item ? item['rule'] : item
      ),
      count: rules.length,
    };
  },
});
