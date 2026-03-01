
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createAction, OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';
import { trueLayerCommon } from '../../common';

export const createPayout = createAction({
  auth: trueLayerCommon.auth,
  name: 'create-payout',
  displayName: 'Create payout',
  description: 'Pay out from one of your merchant accounts. ',
  props: {
    IdempotencyKeyHeader: Property.ShortText({
      displayName: 'Used to ensure idempotent requests',
      required: true,
    }),
    SignatureHeader: Property.ShortText({
      displayName: 'Used for request signature verification',
      required: true,
    }),
  },
  run: async (ctx) => {
    const response = await  await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${trueLayerCommon.baseUrl}/v3/payouts`,
      headers: {
        Authorization: `Bearer ${(ctx.auth as OAuth2PropertyValue).access_token}`,
        'Idempotency-Key': ctx.propsValue.IdempotencyKeyHeader,
        'Signature': ctx.propsValue.SignatureHeader,
      },
      body: ctx.propsValue,
    })

    return response.body
  },
});
