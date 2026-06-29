import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { stripeAuth } from '../..';
import { stripeCommon } from '../common';

export const stripeGetPaymentMethod = createAction({
  name: 'get_payment_method',
  auth: stripeAuth,
  displayName: 'Get Payment Method (Agent)',
  description: 'Retrieve a PaymentMethod by its ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Fetches a single PaymentMethod by its ID (e.g., pm_...), including type and (masked) card details. Use List Customer Payment Methods to discover a customer\'s PaymentMethod IDs. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    payment_method_id: Property.ShortText({
      displayName: 'Payment Method ID',
      description:
        'The PaymentMethod ID (e.g., pm_...). Obtain it from List Customer Payment Methods.',
      required: true,
    }),
  },
  async run(context) {
    const { payment_method_id } = context.propsValue;
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${stripeCommon.baseUrl}/payment_methods/${payment_method_id}`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.secret_text,
      },
    });
    return response.body;
  },
});
