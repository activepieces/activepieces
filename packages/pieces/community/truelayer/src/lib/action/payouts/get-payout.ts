
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { trueLayerCommon } from '../../common';

export const getPayout = createAction({
  auth: trueLayerCommon.auth,
  name: 'get-payout',
  displayName: 'Get payout',
  description: 'Returns payout details. ',
  props: {
    id: Property.ShortText({
      displayName: 'ID of the payout',
      required: true,
    }),
  },
  run: async (ctx) => {
    const response = await  httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${trueLayerCommon.baseUrl}/v3/payouts/${ctx.propsValue.id}`,
      headers: {
        Authorization: `${ctx.auth}`,
      }
    })

    return response.body;

  },
});
