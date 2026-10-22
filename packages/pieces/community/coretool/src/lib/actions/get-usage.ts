import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { coretoolAuth } from '../auth';
import { coretoolClient } from '../common/client';

export const getUsage = createAction({
  auth: coretoolAuth,
  name: 'get_usage',
  displayName: 'Get Usage',
  description: 'Returns the calls used and remaining for the current plan.',
  audience: 'both',
  classification: 'READ',
  aiMetadata: {
    description:
      'Use this to find out how many API calls are used and left in the current period before creating invoices. It is read-only and safe to repeat.',
    idempotent: true,
  },
  props: {},
  async run(context) {
    const response = await coretoolClient.request<Record<string, unknown>>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.GET,
      path: '/usage',
      what: 'Could not read the usage',
    });
    const usage =
      response['usage'] && typeof response['usage'] === 'object'
        ? (response['usage'] as Record<string, unknown>)
        : {};
    return { key_id: response['key_id'], ...usage, pricing: response['pricing'] };
  },
});
