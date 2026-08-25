import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createAction, OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';
import { trueLayerCommon } from '../../common';

export const merchantAccountGetSweeping = createAction({
  auth: trueLayerCommon.auth,
  name: 'merchant-account-get-sweeping',
  displayName: 'Get Sweeping Settings',
  description: 'Get the automatic sweeping settings for a merchant account.',
  audience: 'both',
  aiMetadata: { description: 'Retrieve the current automatic sweeping configuration (threshold, frequency, destination IBAN) for a merchant account by its ID. Use to check whether and how sweeping is set up; read-only and safe to repeat. To change it use Set Up or Update Sweeping, or Disable Sweeping.', idempotent: true },
  props: {
    id: Property.ShortText({
      displayName: 'Merchant Account ID',
      description: 'The ID of the merchant account to fetch the sweeping settings for.',
      required: true,
    }),
  },
  run: async (ctx) => {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${trueLayerCommon.baseUrl}/v3/merchant-accounts/${ctx.propsValue.id}/sweeping`,
      headers: {
        Authorization: `Bearer ${(ctx.auth as OAuth2PropertyValue).access_token}`,
      },
    })

    return response.body
  },
});
