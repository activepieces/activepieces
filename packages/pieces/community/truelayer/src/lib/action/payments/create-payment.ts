import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createAction, OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';
import { trueLayerCommon } from '../../common';

export const createPayment = createAction({
  auth: trueLayerCommon.auth,
  name: 'create-payment',
  displayName: 'Create Payment',
  description: 'Create a new payment. This API must be called using a backend bearer token.',
  props: {
    IdempotencyKeyHeader: Property.ShortText({
      displayName: 'Idempotency Key',
      description: 'A key that uniquely identifies the request. If the same key is sent in another request, the operation will have the same result as the first request.',
      required: true,
    }),
    SignatureHeader: Property.ShortText({
      displayName: 'Signature Header',
      description: 'Header containing the signature of the request payload for authentication purposes.',
      required: true,
    }),
    PsuIpAddressHeader: Property.ShortText({
      displayName: 'PSU IP Address',
      description: 'Used to collect and record the end-user\'s IP address. Only considered if the authorization_flow object in the request body is specified.',
      required: false,
    }),
    DeviceUserAgentHeader: Property.ShortText({
      displayName: 'Device User Agent',
      description: 'Used to improve the end-user\'s authentication experience based on the device type. If omitted, the `User-Agent` header will be used instead. Only considered if the authorization_flow object in the request body is specified.',
      required: false,
    }),
  },
  run: async (ctx) => {
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${trueLayerCommon.baseUrl}/v3/payments`,
      headers: {
        Authorization: `Bearer ${(ctx.auth as OAuth2PropertyValue).access_token}`,
        'Idempotency-Key': ctx.propsValue.IdempotencyKeyHeader,
        'Signature': ctx.propsValue.SignatureHeader,
        'PSU-IP-Address': ctx.propsValue.PsuIpAddressHeader,
        'Device-User-Agent': ctx.propsValue.DeviceUserAgentHeader,
      },
      body: ctx.propsValue,
    });

    return response.body;
}});
