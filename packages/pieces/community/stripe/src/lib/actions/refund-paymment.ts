import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';
import { stripeAuth } from '../..';
import { stripeCommon } from '../common';

export const refundPayment = createAction({
  auth: stripeAuth,
  name: 'refund_payment',
  displayName: 'Refund Payment',
  description: 'Refunds a charge or payment intent. Either a Charge ID or Payment Intent ID must be provided.',
  props: {
    payment_intent: Property.ShortText({
      displayName: 'Payment Intent ID',
      description: 'The ID of the payment intent to refund (e.g. pi_XXXXXXXXXXXXXX). Required if Charge ID is not provided.',
      required: false,
    }),
    charge: Property.ShortText({
      displayName: 'Charge ID',
      description: 'The ID of the charge to refund (e.g. ch_XXXXXXXXXXXXXX). Required if Payment Intent ID is not provided.',
      required: false,
    }),
    amount: Property.Number({
      displayName: 'Amount',
      description: 'The amount to refund (e.g. 12.99). If left blank, a full refund will be issued.',
      required: false,
    }),
    reason: Property.StaticDropdown({
      displayName: 'Reason',
      description: 'An optional reason for the refund.',
      required: false,
      options: {
        options: [
          { label: 'Duplicate', value: 'duplicate' },
          { label: 'Fraudulent', value: 'fraudulent' },
          { label: 'Requested by Customer', value: 'requested_by_customer' },
        ],
      },
    }),
    instructions_email: Property.ShortText({
      displayName: 'Instructions Email',
      description: 'For payment methods without native refund support (e.g. Konbini, PromptPay), the customer email to send refund instructions to.',
      required: false,
    }),
    refund_application_fee: Property.Checkbox({
      displayName: 'Refund Application Fee',
      description: 'Whether the application fee should be refunded when refunding this charge.',
      required: false,
    }),
    reverse_transfer: Property.Checkbox({
      displayName: 'Reverse Transfer',
      description: 'Whether the transfer should be reversed when refunding this charge.',
      required: false,
    }),
    metadata: Property.Json({
      displayName: 'Metadata',
      description: 'A set of key-value pairs to store additional information about the refund.',
      required: false,
    }),
  },
  async run(context) {
    const {
      payment_intent,
      charge,
      amount,
      reason,
      instructions_email,
      refund_application_fee,
      reverse_transfer,
      metadata,
    } = context.propsValue;

    const body: { [key: string]: unknown } = {};

    if (payment_intent) body.payment_intent = payment_intent;
    if (charge) body.charge = charge;
    if (amount !== undefined && amount !== null) body.amount = Math.round(amount * 100);
    if (reason) body.reason = reason;
    if (instructions_email) body.instructions_email = instructions_email;
    if (refund_application_fee !== undefined && refund_application_fee !== null) {
      body.refund_application_fee = refund_application_fee;
    }
    if (reverse_transfer !== undefined && reverse_transfer !== null) {
      body.reverse_transfer = reverse_transfer;
    }
    if (metadata && typeof metadata === 'object') {
      Object.keys(metadata).forEach((key) => {
        body[`metadata[${key}]`] = (metadata as Record<string, string>)[key];
      });
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${stripeCommon.baseUrl}/refunds`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.secret_text,
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body,
    });

    return response.body;
  },
});
