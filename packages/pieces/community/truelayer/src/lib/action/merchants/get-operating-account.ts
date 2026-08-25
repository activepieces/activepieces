import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createAction, OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';
import { trueLayerCommon } from '../../common';

export const getOperatingAccount = createAction({
  auth: trueLayerCommon.auth,
  name: 'get-operating-account',
  displayName: 'Get Merchant Account',
  description: 'Get the details of a single merchant account.',
  audience: 'both',
  aiMetadata: { description: 'Retrieve the details of a single merchant account by its ID, including currency, balance, and account identifiers. Use when you already have the account ID; read-only and safe to repeat. To discover account IDs first, use List Merchant Accounts.', idempotent: true },
  props: {
    id: Property.ShortText({
      displayName: 'Merchant Account ID',
      description: 'The ID of the merchant account to be retrieved.',
      required: true,
    }),
  },
  run: async (ctx) => {
    const response =await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${trueLayerCommon.baseUrl}/v3/merchant-accounts/${ctx.propsValue.id}`,
      headers: {
        Authorization: `Bearer ${(ctx.auth as OAuth2PropertyValue).access_token}`,
      },
    })

    return response.body;
  },
});
