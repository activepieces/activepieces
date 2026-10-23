import { createAction } from '@activepieces/pieces-framework';

import { scrapelessApiAuth } from '../../auth';
import { scrapelessApi } from '../../common/api';

export const getAccountInfoAction = createAction({
  auth: scrapelessApiAuth,
  name: 'scrapeless_get_account_info',
  displayName: 'Get Account Info',
  description:
    'Gets the connected account’s credit balance and subscription plan.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns the connected Scrapeless account’s user id, remaining credits and subscription plan (credits, usage, price, expiry). Use it to check the balance before running costly scrapes, crawls or browser sessions.',
    idempotent: true,
  },
  props: {},
  async run({ auth }) {
    return await scrapelessApi.getMe({ auth });
  },
});
