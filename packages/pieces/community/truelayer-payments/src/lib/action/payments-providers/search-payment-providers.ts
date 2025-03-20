import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { trueLayerCommon } from '../../common/common';

export const searchPaymentProviders = createAction({
  auth: trueLayerCommon.auth,
  name: 'search-payment-providers',
  displayName: 'Search Payment Providers',
  description: 'Returns a list of payment providers.',
  props: {},
  run: async (ctx) => {
    return httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${trueLayerCommon.baseUrl}/v3/payments-providers/search`,
      body: ctx.propsValue,
    }).then(res => res.body);
  },
});
