import { createAction, Property } from '@activepieces/pieces-framework';
import { mollieAuth } from '../..';
import { mollieCommon, MollieRefund } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const mollieCreateRefund = createAction({
  auth: mollieAuth,
  name: 'create_refund',
  displayName: 'Create Payment Refund',
  description: 'Create a refund for a payment',
  props: {
    paymentId: Property.ShortText({
      displayName: 'Payment ID',
      description: 'The ID of the payment to refund',
      required: true,
    }),
    amount: Property.Number({
      displayName: 'Amount',
      description:
        'The amount to refund (leave empty to refund the full payment)',
      required: false,
    }),
    currency: Property.StaticDropdown({
      displayName: 'Currency',
      description:
        'The currency of the refund (required if amount is specified)',
      required: false,
      options: {
        options: [
          { label: 'Euro', value: 'EUR' },
          { label: 'US Dollar', value: 'USD' },
          { label: 'British Pound', value: 'GBP' },
          { label: 'Canadian Dollar', value: 'CAD' },
          { label: 'Australian Dollar', value: 'AUD' },
          { label: 'Japanese Yen', value: 'JPY' },
          { label: 'Swiss Franc', value: 'CHF' },
          { label: 'Swedish Krona', value: 'SEK' },
          { label: 'Norwegian Krone', value: 'NOK' },
          { label: 'Danish Krone', value: 'DKK' },
          { label: 'Polish Zloty', value: 'PLN' },
        ],
      },
    }),
    description: Property.ShortText({
      displayName: 'Description',
      description: 'A description of the refund',
      required: false,
    }),
    metadata: Property.Json({
      displayName: 'Metadata',
      description: 'Custom metadata to attach to the refund',
      required: false,
    }),
  },
  async run(context) {
    const refundData: any = {};

    if (context.propsValue.amount) {
      if (!context.propsValue.currency) {
        throw new Error('Currency is required when amount is specified');
      }
      refundData.amount = {
        value: context.propsValue.amount.toFixed(2),
        currency: context.propsValue.currency,
      };
    }

    if (context.propsValue.description) {
      refundData.description = context.propsValue.description;
    }

    if (context.propsValue.metadata) {
      refundData.metadata = context.propsValue.metadata;
    }

    const refund = await mollieCommon.makeRequest<MollieRefund>(
      context.auth,
      HttpMethod.POST,
      `/payments/${context.propsValue.paymentId}/refunds`,
      refundData
    );

    return refund;
  },
});
