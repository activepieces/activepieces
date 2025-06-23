import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createAction, OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';
import { trueLayerCommon } from '../../common';

export const merchantAccountSetupSweeping = createAction({
  auth: trueLayerCommon.auth,
  name: 'merchant-account-setup-sweeping',
  displayName: 'Set Up or Update Sweeping',
  description: 'Set the automatic sweeping settings for a merchant account. At regular intervals, any available balance in excess of the configured `max_amount_in_minor` is withdrawn to a pre-configured IBAN.',
  props: {
    id: Property.ShortText({
      displayName: 'Merchant Account ID',
      description: 'The ID of the merchant account to set or update sweeping settings for.',
      required: true,
    }),
    max_amount_in_minor: Property.ShortText({
      displayName: 'Max Amount in Minor Units',
      description: 'The amount above which sweeping will occur, expressed in minor units (e.g., 100 means 1 GBP).',
      required: true,
    }),
    frequency: Property.ShortText({
      displayName: 'Sweeping Frequency',
      description: 'The frequency of the sweeping operation (e.g., daily, weekly).',
      required: true,
    }),
    iban: Property.ShortText({
      displayName: 'IBAN',
      description: 'The IBAN to which sweeping funds will be transferred.',
      required: true,
    }),
  },
  run: async (ctx) => {
    const response =  await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${trueLayerCommon.baseUrl}/v3/merchant-accounts/${ctx.propsValue.id}/sweeping`,
      headers: {
        Authorization: `Bearer ${(ctx.auth as OAuth2PropertyValue).access_token}`,
      },
      body: {
        max_amount_in_minor: ctx.propsValue.max_amount_in_minor,
        frequency: ctx.propsValue.frequency,
        iban: ctx.propsValue.iban,
      },
    })

    return response.body;
  },
});
