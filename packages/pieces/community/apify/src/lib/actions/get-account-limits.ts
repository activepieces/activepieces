import { createAction } from '@activepieces/pieces-framework';
import { apifyAuth } from '../..';
import { createApifyClient } from '../common';

export const apifyGetAccountLimits = createAction({
  name: 'apify_get_account_limits',
  auth: apifyAuth,
  displayName: 'Get Account Limits',
  description: 'Retrieves the authenticated account\'s plan limits and current usage.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Get the account\'s plan limits and current usage (e.g. max concurrent runs, monthly compute). Use this to decide whether a run will fit the plan before starting it with Run Actor, or to explain a usage-limit error. Use Get Account for the profile. Read-only and idempotent.',
    idempotent: true,
  },
  props: {},
  async run(context) {
    const apifyToken = context.auth.props.apikey;
    const client = createApifyClient(apifyToken);

    try {
      const limits = await client.user('me').limits();
      return limits;
    } catch (error: any) {
      if (error.statusCode === 401) {
        throw new Error('Invalid Apify API token.');
      }
      if (error.statusCode === 429) {
        throw new Error('Apify rate limit exceeded. Retry after a short delay.');
      }
      throw new Error(`Failed to get account limits: ${error.message || error}`);
    }
  },
});
