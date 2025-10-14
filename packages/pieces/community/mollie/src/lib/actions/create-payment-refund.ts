import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mollieCommon } from '../common';
import { mollieAuth } from '../../index';

export const mollieCreatePaymentRefund = createAction({
  auth: mollieAuth,
  name: 'create_payment_refund',
  displayName: 'Create Payment Refund',
  description: 'Creates refund for payment',
  props: {
    paymentId: Property.Dropdown({
      displayName: 'Payment',
      description: 'Select the payment to refund',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please connect your account first',
          };
        }

        try {
          const apiKey = auth as string;
          const payments = await mollieCommon.makeRequest(
            apiKey,
            HttpMethod.GET,
            '/payments?limit=250'
          );

          const options =
            (payments as { data?: unknown[] }).data?.map((payment: unknown) => {
              const paymentData = payment as Record<string, unknown>;
              const amount = paymentData['amount'] as Record<string, unknown>;
              return {
                label: `${paymentData['description'] || paymentData['id']} - ${
                  amount['currency']
                } ${amount['value']} (${paymentData['status']})`,
                value: paymentData['id'],
              };
            }) || [];

          return {
            disabled: false,
            options,
            placeholder: 'Select a payment',
          };
        } catch (error) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Failed to load payments',
          };
        }
      },
    }),

    description: Property.ShortText({
      displayName: 'Description',
      description: 'The description of the refund (max 255 characters)',
      required: false,
    }),

    currency: Property.ShortText({
      displayName: 'Currency',
      description: 'A three-character ISO 4217 currency code (e.g. EUR, USD)',
      required: true,
      defaultValue: 'EUR',
    }),
    amount: Property.ShortText({
      displayName: 'Refund Amount',
      description: 'The amount to refund (e.g. "10.00")',
      required: true,
    }),

    metadata: Property.ShortText({
      displayName: 'Metadata',
      description: 'Additional data to save alongside the refund (JSON string)',
      required: false,
    }),

    includeExternalReference: Property.Checkbox({
      displayName: 'Include External Reference',
      description: 'Whether to include external reference details',
      required: false,
      defaultValue: false,
    }),
    externalReferenceType: Property.StaticDropdown({
      displayName: 'External Reference Type',
      description: 'Type of external reference',
      required: false,
      options: {
        options: [{ label: 'Acquirer Reference', value: 'acquirer-reference' }],
      },
    }),
    externalReferenceId: Property.ShortText({
      displayName: 'External Reference ID',
      description: 'Unique reference from the payment provider',
      required: false,
    }),

    reverseRouting: Property.Checkbox({
      displayName: 'Reverse Routing',
      description:
        'Pull back funds routed to connected merchants (full refund only)',
      required: false,
      defaultValue: false,
    }),

    includeRoutingReversals: Property.Checkbox({
      displayName: 'Include Routing Reversals',
      description: 'Specify detailed routing reversals for partial refunds',
      required: false,
      defaultValue: false,
    }),

    routingReversals: Property.Array({
      displayName: 'Routing Reversals',
      description: 'Detailed routing reversals for connected merchants',
      required: false,
      properties: {
        amountCurrency: Property.ShortText({
          displayName: 'Amount Currency',
          description: 'Currency for the reversal amount',
          required: true,
          defaultValue: 'EUR',
        }),
        amountValue: Property.ShortText({
          displayName: 'Amount Value',
          description: 'The amount to pull back',
          required: true,
        }),
        sourceType: Property.StaticDropdown({
          displayName: 'Source Type',
          description: 'Type of source to pull funds from',
          required: true,
          defaultValue: 'organization',
          options: {
            options: [{ label: 'Organization', value: 'organization' }],
          },
        }),
        organizationId: Property.ShortText({
          displayName: 'Organization ID',
          description: 'ID of the connected organization to pull funds from',
          required: true,
        }),
      },
    }),

    testmode: Property.Checkbox({
      displayName: 'Test Mode',
      description: 'Whether to create the refund in test mode',
      required: false,
      defaultValue: false,
    }),
  },

  async run({ auth, propsValue }) {
    const apiKey = auth as string;

    const refundData: Record<string, unknown> = {
      amount: {
        currency: propsValue.currency,
        value: propsValue.amount,
      },
    };

    if (propsValue.description) {
      refundData['description'] = propsValue.description;
    }

    if (propsValue.metadata) {
      try {
        refundData['metadata'] = JSON.parse(propsValue.metadata);
      } catch {
        refundData['metadata'] = propsValue.metadata;
      }
    }

    if (
      propsValue.includeExternalReference &&
      propsValue.externalReferenceType &&
      propsValue.externalReferenceId
    ) {
      refundData['externalReference'] = {
        type: propsValue.externalReferenceType,
        id: propsValue.externalReferenceId,
      };
    }

    if (propsValue.reverseRouting) {
      refundData['reverseRouting'] = true;
    }

    if (
      propsValue.includeRoutingReversals &&
      propsValue.routingReversals &&
      Array.isArray(propsValue.routingReversals)
    ) {
      const reversals = (propsValue.routingReversals as unknown[]).map(
        (reversal: unknown) => {
          const reversalData = reversal as Record<string, unknown>;
          return {
            amount: {
              currency: reversalData['amountCurrency'],
              value: reversalData['amountValue'],
            },
            source: {
              type: reversalData['sourceType'],
              organizationId: reversalData['organizationId'],
            },
          };
        }
      );

      refundData['routingReversals'] = reversals;
    }

    const response = await mollieCommon.makeRequest(
      apiKey,
      HttpMethod.POST,
      `/payments/${propsValue.paymentId}/refunds`,
      refundData,
      propsValue.testmode
    );

    return response;
  },
});
