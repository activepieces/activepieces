import { createAction, Property } from '@activepieces/pieces-framework';
import { checkoutComAuth } from '../common/auth';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const refundPaymentAction = createAction({
  name: 'refund_payment',
  auth: checkoutComAuth,
  displayName: 'Refund a Payment',
  description: 'Issue a refund (full or partial) for a captured payment.',
  props: {
    paymentId: Property.ShortText({
      displayName: 'Payment ID',
      required: true,
    }),
    amount: Property.Number({
      displayName: 'Amount (optional, for partial refund)',
      required: false,
    }),
    reference: Property.ShortText({
      displayName: 'Reference',
      required: false,
    }),
  },
  async run(context) {
    const { paymentId, amount, reference } = context.propsValue;
    const body: Record<string, any> = {};
    if (amount) body.amount = amount;
    if (reference) body.reference = reference;
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `https://api.checkout.com/payments/${paymentId}/refunds`,
      headers: {
        Authorization: `Bearer ${context.auth}`,
        'Content-Type': 'application/json',
      },
      body,
    });
    return response.body;
  },
}); 