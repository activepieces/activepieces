import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { yocoAuth } from '../auth';
import { yocoRequest } from '../common/client';

export const refundPaymentAction = createAction({
  auth: yocoAuth,
  name: 'refund_payment',
  displayName: 'Refund Payment',
  description: 'Issue a full or partial refund for a Yoco payment.',
  props: {
    payment_id: Property.ShortText({
      displayName: 'Payment ID',
      description: 'The Yoco payment ID (from a successful checkout).',
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
      reason: propsValue.reason ?? 'Refunded from Synkra Flow',
    };
    if (propsValue.amount) {
      body['amount'] = Math.round(Number(propsValue.amount) * 100);
    }
    return yocoRequest<Record<string, unknown>>({
      secretKey: auth.props.secret_key,
      method: HttpMethod.POST,
      path: `/payments/${encodeURIComponent(String(propsValue.payment_id))}/refund`,
      body,
    });
  },
});
