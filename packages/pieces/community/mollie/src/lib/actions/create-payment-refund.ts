import { createAction, Property } from '@activepieces/pieces-framework';
import { mollieAuth } from '../common/common';
import { MollieApi } from '../common/common';

export const createRefundAction = createAction({
  auth: mollieAuth,
  name: 'create_refund',
  displayName: 'Create Payment Refund',
  description: 'Creates refund for payment',
  props: {
    paymentId: Property.ShortText({
      displayName: 'Payment ID',
      description: 'ID of the payment to refund',
      required: true,
    }),
    amount: Property.Number({
      displayName: 'Refund Amount',
      description: 'Amount to refund (leave empty for full refund)',
      required: false,
    }),
    currency: Property.StaticDropdown({
      displayName: 'Currency',
      required: false,
      defaultValue: 'EUR',
      options: {
        options: [
          { label: 'EUR', value: 'EUR' },
          { label: 'USD', value: 'USD' },
          { label: 'GBP', value: 'GBP' },
        ],
      },
    }),
    description: Property.ShortText({
      displayName: 'Description',
      description: 'Refund description',
      required: false,
    }),
    metadata: Property.Object({
      displayName: 'Metadata',
      required: false,
    }),
  },
  async run(context) {
    const api = new MollieApi({ apiKey: context.auth });
    
    const refundData: any = {
      description: context.propsValue.description,
      metadata: context.propsValue.metadata,
    };

    if (context.propsValue.amount && context.propsValue.currency) {
      refundData.amount = {
        currency: context.propsValue.currency,
        value: context.propsValue.amount.toFixed(2),
      };
    }

    return await api.createRefund(context.propsValue.paymentId, refundData);
  },
});