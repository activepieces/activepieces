import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createAction, OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';
import { trueLayerCommon } from '../../common';

export const confirmMandateFunds = createAction({
  auth: trueLayerCommon.auth,
  name: 'confirm-mandate-funds',
  displayName: 'Confirm Mandate Funds',
  description: 'Confirm that the PSU has the given funds. This API can be called using the mandate_token associated with the mandate or using a backend bearer token.',
  props: {
    id: Property.ShortText({
      displayName: 'Mandate ID',
      description: 'ID of the Mandate to be confirmed.',
      required: true,
    }),
    amount_in_minor: Property.ShortText({
      displayName: 'Amount in Minor Units',
      description: 'A "cent" value representing the amount. For example, 100 == 1 GBP.',
      required: true,
    }),
    currency: Property.ShortText({
      displayName: 'Currency',
      description: 'Currency code (e.g., GBP, EUR).',
      required: true,
    }),
  },
  run: async (ctx) => {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${trueLayerCommon.baseUrl}/v3/mandates/${ctx.propsValue.id}/funds`,
      headers: {
        Authorization: `Bearer ${(ctx.auth as OAuth2PropertyValue).access_token}`,
      },
      body: {
        amount_in_minor: ctx.propsValue.amount_in_minor,
        currency: ctx.propsValue.currency,
      },
    })

    return response.body;
  },
});
