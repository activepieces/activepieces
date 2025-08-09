import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { MollieAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { currencyDropdown, paymentIdDropdown } from '../common/props';

export const createPaymentRefund = createAction({
  auth: MollieAuth,
  name: 'createPaymentRefund',
  displayName: 'Create Payment Refund',
  description: 'Create a refund for a payment made through Mollie',
  props: {
    paymentId: paymentIdDropdown,
    amount_currency: currencyDropdown,
    amount_value: Property.ShortText({
      displayName: 'Amount Value',
      description:
        'Amount value in the smallest currency unit (e.g. cents for EUR)',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Description for the refund (optional)',
      required: false,
    }),
    metadata: Property.Object({
      displayName: 'Metadata',
      description:
        'Custom metadata object for storing additional refund information',
      required: false,
    }),
    reverseRouting: Property.Checkbox({
      displayName: 'Reverse Routing',
      description:
        'Force refund to be routed to a different payment method than the original payment',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const refundData: any = {
      amount: {
        currency: propsValue.amount_currency,
        value: propsValue.amount_value,
      },
    };

    if (propsValue.description) {
      refundData.description = propsValue.description;
    }
    if (propsValue.metadata) {
      refundData.metadata = propsValue.metadata;
    }
    if (propsValue.reverseRouting !== undefined) {
      refundData.reverseRouting = propsValue.reverseRouting;
    }

    const response = await makeRequest(
      auth,
      HttpMethod.POST,
      `/payments/${propsValue.paymentId}/refunds`,
      refundData
    );

    return response;
  },
});
