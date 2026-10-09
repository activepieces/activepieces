import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { ikhokhaAuth } from '../auth';
import { ikhokhaRequest } from '../common/client';

export const refundPaymentAction = createAction({
  auth: ikhokhaAuth,
  name: 'refund_payment',
  displayName: 'Refund Payment',
  description: 'Issue a refund for a completed iKhokha payment.',
  props: {
    payment_id: Property.ShortText({
      displayName: 'Payment ID',
      required: true,
    }),
    amount: Property.Number({
      displayName: 'Refund Amount (ZAR)',
      description: 'Leave blank for full refund.',
      required: false,
    }),
    reason: Property.LongText({
      displayName: 'Reason',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const body: Record<string, unknown> = {
      paymentId: propsValue.payment_id,
      reason: propsValue.reason ?? 'Refunded from Synkra Flow',
    };
    if (propsValue.amount) {
      body['amount'] = Math.round(Number(propsValue.amount) * 100);
    }
    return ikhokhaRequest<Record<string, unknown>>({
      auth: auth.props,
      method: HttpMethod.POST,
      path: '/public/v1/refunds',
      body,
    });
  },
});
