import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createAction, OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';
import { trueLayerCommon } from '../../common';

export const submitPaymentsProviderReturnParameters = createAction({
  auth: trueLayerCommon.auth,
  name: 'submit-payments-provider-return-parameters',
  displayName: 'Submit payments return parameters',
  description: 'Submit direct return query and fragment parameters returned from the provider.',
  props: {
    IdempotencyKeyHeader: Property.ShortText({
      displayName: 'Idempotency Key Header',
      description: 'Used to ensure idempotent requests',
      required: false,
    }),
  },
  run: async (ctx) => {
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${trueLayerCommon.baseUrl}/v3/payments-provider-return`,
      headers: {
        Authorization: `Bearer ${(ctx.auth as OAuth2PropertyValue).access_token}`,
        'Idempotency-Key': ctx.propsValue.IdempotencyKeyHeader,
      },
      body: ctx.propsValue,
    })
    return response.body
  },
});
