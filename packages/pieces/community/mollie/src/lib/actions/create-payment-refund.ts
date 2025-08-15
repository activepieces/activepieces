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
    amount: Property.ShortText({
      displayName: 'Refund Amount',
      description: 'Amount to refund (exact amount string with 2 decimals, e.g. 10.00)',
      required: true,
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
    const api = new MollieApi({ accessToken: context.auth.access_token });
    
    const refundData: any = {
      description: context.propsValue.description,
      metadata: context.propsValue.metadata,
    };

    if (context.propsValue.amount && context.propsValue.currency) {
      refundData.amount = {
        currency: context.propsValue.currency,
        value: context.propsValue.amount,
      };
    }

    return await api.createRefund(context.propsValue.paymentId, refundData);
  },
});