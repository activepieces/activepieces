import { createAction } from '@activepieces/pieces-framework';
import { apifyAuth } from '../..';
import { createApifyClient } from '../common';
import { getAccountActionOutputSchema } from '../output-schemas';

export const apifyGetAccount = createAction({
  name: 'apify_get_account',
  auth: apifyAuth,
  displayName: 'Get Account',
  description: 'Retrieves the authenticated Apify account profile.',
  audience: 'ai',
  outputSchema: getAccountActionOutputSchema,
  aiMetadata: {
    description:
      'Get the authenticated account profile (username, plan, ids). Use this to confirm which account the connection belongs to or to read the username needed to build a "username~actor-name" actor reference. Use Get Account Limits for plan limits and usage. Read-only and idempotent.',
    idempotent: true,
  },
  props: {},
  async run(context) {
    const apifyToken = context.auth.props.apikey;
    const client = createApifyClient(apifyToken);

    try {
      const user = await client.user('me').get();
      return user;
    } catch (error: any) {
      if (error.statusCode === 401) {
        throw new Error('Invalid Apify API token.');
      }
      if (error.statusCode === 429) {
        throw new Error('Apify rate limit exceeded. Retry after a short delay.');
      }
      throw new Error(`Failed to get account: ${error.message || error}`);
    }
  },
});
