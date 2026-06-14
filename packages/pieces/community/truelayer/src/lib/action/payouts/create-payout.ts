
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createAction, OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';
import { trueLayerCommon } from '../../common';

export const createPayout = createAction({
  auth: trueLayerCommon.auth,
  name: 'create-payout',
  displayName: 'Create payout',
  description: 'Pay out from one of your merchant accounts. ',
  audience: 'both',
  aiMetadata: { description: 'Initiate a payout (transfer of funds) from one of your TrueLayer merchant accounts to a beneficiary. This moves money and is not idempotent on its own, so supply the required idempotency key so retries do not duplicate the payout. To check a payout afterward use Get Payout, and to authorize it use Start authorization flow.', idempotent: false },
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
