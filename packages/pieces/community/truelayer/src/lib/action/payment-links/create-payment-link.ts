import { httpClient, HttpMethod } from '@ensemble/pieces-common';
import { createAction, OAuth2PropertyValue, Property } from '@ensemble/pieces-framework';
import { trueLayerCommon } from '../../common';

export const createPaymentLink = createAction({
  auth: trueLayerCommon.auth,
  name: 'create-payment-link',
  displayName: 'Create Payment Link',
  description: 'Create a new payment link. This API must be called using a backend bearer token.',
  props: {
    IdempotencyKeyHeader: Property.ShortText({
      displayName: 'Idempotency Key Header',
      description: 'Used to ensure idempotent requests.',
      required: false,
    }),
    SignatureHeader: Property.ShortText({
      displayName: 'Signature Header',
      description: 'Used for request signature verification.',
      required: false,
    }),
  },
  run: async (ctx) => {
    const response =  await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${trueLayerCommon.baseUrl}/v3/payment-links`,
      headers: {
        Authorization: `Bearer ${(ctx.auth as OAuth2PropertyValue).access_token}`,
        'Idempotency-Key': ctx.propsValue.IdempotencyKeyHeader,
        'Signature': ctx.propsValue.SignatureHeader,
      },
      body: ctx.propsValue,
    })

    return response.body;
  },
});
