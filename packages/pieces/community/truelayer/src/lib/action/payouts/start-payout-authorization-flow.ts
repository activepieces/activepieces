
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { trueLayerCommon } from '../../common';

export const startPayoutAuthorizationFlow = createAction({
  auth: trueLayerCommon.auth,
  name: 'start-payout-authorization-flow',
  displayName: 'Start authorization flow',
  description: 'Start the authorization flow for a payout. This API can be called using the `resource_token` associated with the payout you are trying to fetch.',
  props: {
    id: Property.ShortText({
      displayName: 'ID of the payout',
      required: true,
    }),
  },
  run: async (ctx) => {
    const response = await  httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${trueLayerCommon.baseUrl}/v3/payouts/${ctx.propsValue.id}/authorization-flow`,
      headers: {
        Authorization: `${ctx.auth}`,
      },
      body: ctx.propsValue,
    })

    return response.body;
  },
});
