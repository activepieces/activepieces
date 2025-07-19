import { httpClient, HttpMethod } from '@ensemble/pieces-common';
import { createAction } from '@ensemble/pieces-framework';
import { trueLayerCommon } from '../../common';

export const searchPaymentProviders = createAction({
  auth: trueLayerCommon.auth,
  name: 'search-payment-providers',
  displayName: 'Search Payment Providers',
  description: 'Returns a list of payment providers.',
  props: {},
  run: async (ctx) => {
    const response = await  httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${trueLayerCommon.baseUrl}/v3/payments-providers/search`,
      body: ctx.propsValue,
    })

    return response.body;
  },
});
