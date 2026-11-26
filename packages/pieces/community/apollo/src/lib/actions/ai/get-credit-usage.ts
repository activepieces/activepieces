import { createAction } from '@activepieces/pieces-framework';
import { apolloAuth } from '../../auth';
import { apiKeyOf } from '../../common/client';
import { apolloOutputSchemas } from '../../common/output-schemas';
import { apolloRequests } from '../../common/requests';

export const aiGetCreditUsageAction = createAction({
  auth: apolloAuth,
  name: 'ai_get_credit_usage',
  classification: 'READ',
  displayName: 'Get Credit Usage',
  description: 'Show remaining Apollo credits and the user the API key acts as.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns the Apollo user the API key acts as (user_id usable as an owner or task assignee, team, email) and the credit balance: remaining credits plus lead, direct-dial, export and AI credits allowed and used this cycle. Check it before credit-using tools. Uses no credits.',
    idempotent: true,
  },
  props: {},
  outputSchema: apolloOutputSchemas.creditUsage,
  async run({ auth }) {
    const profile = await apolloRequests.getProfile({ apiKey: apiKeyOf(auth), includeCreditUsage: true });
    const numberAt = (key: string): number | null => (typeof profile[key] === 'number' ? profile[key] : null);
    const name = [profile['first_name'], profile['last_name']].filter((part) => typeof part === 'string' && part !== '').join(' ');
    return {
      user_id: profile['id'] === undefined ? null : String(profile['id']),
      team_id: profile['team_id'] === undefined ? null : String(profile['team_id']),
      email: typeof profile['email'] === 'string' ? profile['email'] : null,
      name: name === '' ? null : name,
      credits: {
        remaining: numberAt('num_credits_remaining'),
        lead_limit: numberAt('effective_num_lead_credits'),
        lead_used: numberAt('num_lead_credits_used'),
        direct_dial_limit: numberAt('effective_num_direct_dial_credits'),
        direct_dial_used: numberAt('num_direct_dial_credits_used'),
        export_limit: numberAt('effective_num_export_credits'),
        export_used: numberAt('num_export_credits_used'),
        ai_limit: numberAt('effective_num_ai_credits'),
        ai_used: numberAt('num_ai_credits_used'),
        total_used: numberAt('total_unified_credits_used'),
      },
    };
  },
});
