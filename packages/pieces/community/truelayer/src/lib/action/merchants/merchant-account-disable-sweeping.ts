import { httpClient, HttpMethod } from '@ensemble/pieces-common';
import { createAction, OAuth2PropertyValue, Property } from '@ensemble/pieces-framework';
import { trueLayerCommon } from '../../common';

export const merchantAccountDisableSweeping = createAction({
  auth: trueLayerCommon.auth,
  name: 'merchant-account-disable-sweeping',
  displayName: 'Disable Sweeping',
  description: 'Disable automatic sweeping for a merchant account.',
  props: {
    id: Property.ShortText({
      displayName: 'Merchant Account ID',
      description: 'The ID of the merchant account to disable sweeping for.',
      required: true,
    }),
  },
  run: async (ctx) => {
    const response = await await httpClient.sendRequest({
      method: HttpMethod.DELETE,
      url: `${trueLayerCommon.baseUrl}/v3/merchant-accounts/${ctx.propsValue.id}/sweeping`,
      headers: {
        Authorization: `Bearer ${(ctx.auth as OAuth2PropertyValue).access_token}`,
      },
    })

    return response.body
  },
});
