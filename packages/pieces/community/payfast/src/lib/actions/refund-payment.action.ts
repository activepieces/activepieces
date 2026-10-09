import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { payfastAuth } from '../auth';
import { payfastApiRequest } from '../common/client';

export const refundPaymentAction = createAction({
  auth: payfastAuth,
  name: 'refund_payment',
  displayName: 'Refund Payment',
  description:
    'Issue a full or partial refund for a completed PayFast transaction.',
  props: {
    transaction_id: Property.ShortText({
      displayName: 'PayFast Transaction ID',
      description: 'The pf_payment_id from the original payment.',
      required: true,
    }),
    amount: Property.Number({
      displayName: 'Refund Amount (ZAR)',
      description: 'Amount to refund. Leave blank for full refund.',
      required: false,
    }),
    reason: Property.LongText({
      displayName: 'Reason',
      required: false,
    }),
    notify_buyer: Property.Checkbox({
      displayName: 'Email the buyer about the refund',
      required: false,
      defaultValue: true,
    }),
  },
  async run({ auth, propsValue }) {
    const body: Record<string, unknown> = {
      amount: propsValue.amount
        ? Math.round(Number(propsValue.amount) * 100)
        : undefined,
      reason: propsValue.reason ?? 'Refunded from Synkra Flow',
      notify_buyer: propsValue.notify_buyer ? 1 : 0,
      refund_type: propsValue.amount ? 'partial' : 'full',
    };

    return payfastApiRequest<Record<string, unknown>>({
      auth: auth.props,
      method: HttpMethod.POST,
      path: `/refunds/${encodeURIComponent(String(propsValue.transaction_id))}`,
      body,
    });
  },
});
