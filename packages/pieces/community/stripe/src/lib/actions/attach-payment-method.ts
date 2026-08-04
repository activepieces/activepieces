import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { stripeAuth } from '../..';
import { stripeCommon } from '../common';

import { paymentMethodOutputSchema } from '../output-schemas';
export const stripeAttachPaymentMethod = createAction({
  name: 'attach_payment_method',
  auth: stripeAuth,
  displayName: 'Attach Payment Method (Agent)',
  description: 'Attach a PaymentMethod to a customer.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Attaches a PaymentMethod to a customer so it can be charged off-session (e.g. for subscriptions or saved cards). Use after Create Payment Method. Idempotent: re-attaching the same PaymentMethod to the same customer is a no-op.',
    idempotent: true,
  },
  props: {
    payment_method_id: Property.ShortText({
      displayName: 'Payment Method ID',
      description:
        'The PaymentMethod ID (e.g., pm_...) to attach. Obtain it from Create Payment Method or List Customer Payment Methods.',
      required: true,
    }),
    customer: Property.ShortText({
      displayName: 'Customer ID',
      description:
        'The customer ID (e.g., cus_...) to attach the PaymentMethod to.',
      required: true,
    }),
  },
  outputSchema: paymentMethodOutputSchema,
  async run(context) {
    const { payment_method_id, customer } = context.propsValue;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${stripeCommon.baseUrl}/payment_methods/${payment_method_id}/attach`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.secret_text,
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: { customer },
    });

    return response.body;
  },
});
