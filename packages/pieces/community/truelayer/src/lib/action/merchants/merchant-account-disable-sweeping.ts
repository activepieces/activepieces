import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createAction, OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';
import { trueLayerCommon } from '../../common';

export const merchantAccountDisableSweeping = createAction({
  auth: trueLayerCommon.auth,
  name: 'merchant-account-disable-sweeping',
  displayName: 'Disable Sweeping',
  description: 'Disable automatic sweeping for a merchant account.',
  audience: 'both',
  aiMetadata: { description: 'Turn off automatic sweeping for a merchant account by its ID, deleting the current sweeping configuration. Idempotent in effect: once sweeping is off, repeating leaves it off. To configure or re-enable sweeping use Set Up or Update Sweeping.', idempotent: true },
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
