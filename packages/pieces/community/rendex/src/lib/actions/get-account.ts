import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { rendexAuth } from '../common/auth';
import { rendexClient } from '../common/client';
import { getAccountOutputSchema } from '../common/output-schemas';

export const getAccount = createAction({
  auth: rendexAuth,
  name: 'get_account',
  classification: 'READ',
  displayName: 'Get Account Usage',
  description: 'Get your Rendex plan, credits used and remaining this month, and your per-minute rate limit.',
  audience: 'both',
  aiMetadata: {
    description:
      'Returns the Rendex plan, credits used, remaining and the monthly reset date, plus the per-minute rate limit and an upgrade link when relevant. Use it before a batch of renders to check the remaining credits. Free (spends no credit), read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: getAccountOutputSchema,
  props: {},
  async run(context) {
    return rendexClient.requestData({
      auth: context.auth,
      method: HttpMethod.GET,
      path: '/v1/account',
      operation: 'read your account usage',
    });
  },
});
