import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { trueLayerCommon } from '../../common';

export const getPaymentProvider = createAction({
  auth: trueLayerCommon.auth,
  name: 'get-payment-provider',
  displayName: 'Get Payment Provider',
  description: 'Returns payment provider details. This API can be called without the need for authentication.',
  props: {
    id: Property.ShortText({
      displayName: 'Payment Provider ID',
      description: 'The ID of the payment provider to retrieve details for.',
      required: true,
    }),
    client_id: Property.ShortText({
      displayName: 'Client ID',
      description: 'Optional client ID to retrieve specific provider details.',
      required: false,
    }),
    icon_type: Property.ShortText({
      displayName: 'Icon Type',
      description: `Optional configuration for the type of icon:
      - \`default\`: Default icon with no background (SVG).
      - \`extended\`: Extended to a square with an appropriate background color (SVG).
      - \`extended_small\`: Extended icon with 192x192 px size (JPEG).
      - \`extended_medium\`: Extended icon with 432x432 px size (JPEG).
      - \`extended_large\`: Extended icon jpeg with 864x864 px size (JPEG).`,
      required: false,
    }),
  },
  run: async (ctx) => {
    const response = await  httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${trueLayerCommon.baseUrl}/v3/payments-providers/${ctx.propsValue.id}`,
      queryParams: {
        client_id: ctx.propsValue.client_id || '',
        icon_type: ctx.propsValue.icon_type || '',
      },
    })

    return response.body;
  },
});
