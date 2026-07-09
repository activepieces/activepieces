import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createAction, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { trueLayerCommon } from '../../common';

export const listOperatingAccounts = createAction({
  auth: trueLayerCommon.auth,
  name: 'list-operating-accounts',
  displayName: 'List Merchant Accounts',
  description: 'List all your TrueLayer merchant accounts. There might be more than one account per currency.',
  audience: 'both',
  aiMetadata: { description: 'List all merchant accounts belonging to your TrueLayer client, including their currencies and balances. Use to discover available merchant account IDs before creating payouts or configuring sweeping; read-only and safe to repeat. To fetch one account by ID instead, use Get Merchant Account.', idempotent: true },
  props: {},
  run: async (ctx) => {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${trueLayerCommon.baseUrl}/v3/merchant-accounts`,
      headers: {
        Authorization: `Bearer ${(ctx.auth as OAuth2PropertyValue).access_token}`,
      },
    })

    return response.body
  },
});
