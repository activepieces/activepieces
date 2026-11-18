import { createAction } from '@activepieces/pieces-framework';
import { hunterAuth } from '../auth';
import { apiKeyOf } from '../common/client';
import { hunterOutputSchemas } from '../common/output-schemas';
import { hunterRequests } from '../common/requests';

export const getAccountAction = createAction({
  auth: hunterAuth,
  name: 'get_account',
  classification: 'READ',
  displayName: 'Get Account',
  description: 'Get your Hunter plan, credits used and available, and the reset date.',
  audience: 'both',
  aiMetadata: {
    description:
      'Returns the Hunter account: plan name and level, credits used and available this period, and the reset date. Use before credit-spending actions (Find Email, Verify Email, Domain Search, enrichment) to check the remaining balance. Free: uses no credits. Read-only and idempotent.',
    idempotent: true,
  },
  props: {},
  outputSchema: hunterOutputSchemas.account,
  async run(context) {
    return hunterRequests.getAccount({ apiKey: apiKeyOf(context.auth) });
  },
});
