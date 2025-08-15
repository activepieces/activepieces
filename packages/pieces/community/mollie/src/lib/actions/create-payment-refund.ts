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
    amount_currency: currencyDropdown('Amount Currency', true),
    amount_value: Property.ShortText({
      displayName: 'Amount Value',
      description:
        'Amount as decimal string (e.g. "10.99"). Leave empty to refund full payment amount.',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Description for the refund (optional)',
      required: false,
    }),
    externalReference_type: Property.ShortText({
      displayName: 'External Reference Type',
      description: 'Type of the external reference (optional)',
      required: false,
    }),
    externalReference_id: Property.ShortText({
      displayName: 'External Reference ID',
      description: 'ID of the external reference (optional)',
      required: false,
    }),
    reverseRouting: Property.Checkbox({
      displayName: 'Reverse Routing',
      description: 'Enable routing reversals for marketplace refunds',
      required: false,
    }),
    routingReversals: Property.Array({
      displayName: 'Routing Reversals',
      description: 'Specify how much to pull back from connected organizations',
      required: false,
      properties: {
        amount_currency: currencyDropdown('Amount Currency', true),
        amount_value: Property.ShortText({
          displayName: 'Amount Value',
          description: 'Amount as decimal string (e.g. "10.99")',
          required: true,
        }),
        source_organizationId: Property.ShortText({
          displayName: 'Organization ID',
          description: 'ID of the connected organization to pull funds from',
          required: true,
        }),
      },
    }),
  },
  async run({ auth, propsValue }) {
    const refundData: any = {};
    if (propsValue.amount_currency && propsValue.amount_value) {
      refundData.amount = {
        currency: propsValue.amount_currency,
        value: propsValue.amount_value,
      };
    }

    if (propsValue.description) {
      refundData.description = propsValue.description;
    }

    if (propsValue.externalReference_type && propsValue.externalReference_id) {
      refundData.externalReference = {
        type: propsValue.externalReference_type,
        id: propsValue.externalReference_id,
      };
    }

    if (propsValue.reverseRouting !== undefined) {
      refundData.reverseRouting = propsValue.reverseRouting;
    }

    if (propsValue.routingReversals && propsValue.routingReversals.length > 0) {
      refundData.routingReversals = propsValue.routingReversals.map(
        (reversal: any) => ({
          amount: {
            currency: reversal.amount_currency,
            value: reversal.amount_value,
          },
          source: {
            type: 'organization',
            organizationId: reversal.source_organizationId,
          },
        })
      );
    }

    const response = await makeRequest(
      auth.access_token,
      HttpMethod.POST,
      `/payments/${propsValue.paymentId}/refunds`,
      refundData
    );

    return response;
  },
});
