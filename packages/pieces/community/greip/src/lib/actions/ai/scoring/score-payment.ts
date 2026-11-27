import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { greipAuth } from '../../../auth';
import { greipClient } from '../../../common/client';
import { greipPaymentOutputSchema } from '../../../output-schemas';

export const scorePaymentAction = createAction({
  auth: greipAuth,
  name: 'greip_score_payment',
  outputSchema: greipPaymentOutputSchema,
  displayName: 'Score Payment',
  description: 'Get a fraud score, risk level and recommendation for a payment, deposit or withdrawal.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Score a purchase, deposit or withdrawal for fraud and get a score, risk level, recommendation and matched rules. Greip stores the transaction and uses it in velocity rules, so scoring the same transaction twice can change its score. Pass any other Greip payment field (billing_*, shipping_*, card_*, cart_items, customer_*) in Additional Fields. Needs a Greip Premium plan.',
    idempotent: false,
  },
  props: {
    action: Property.StaticDropdown({
      displayName: 'Action',
      description: 'What the customer is doing.',
      required: false,
      options: {
        options: [
          { label: 'Purchase', value: 'purchase' },
          { label: 'Deposit', value: 'deposit' },
          { label: 'Withdrawal', value: 'withdrawal' },
        ],
      },
    }),
    transactionId: Property.ShortText({
      displayName: 'Transaction ID',
      description: 'The transaction id in your system.',
      required: false,
    }),
    transactionAmount: Property.Number({
      displayName: 'Transaction Amount',
      description: 'The total amount of the transaction.',
      required: false,
    }),
    transactionCurrency: Property.ShortText({
      displayName: 'Transaction Currency',
      description: 'ISO 4217 currency code, e.g. USD.',
      required: false,
    }),
    customerId: Property.ShortText({
      displayName: 'Customer ID',
      description: 'The customer id in your system.',
      required: false,
    }),
    customerEmail: Property.ShortText({
      displayName: 'Customer Email',
      required: false,
    }),
    customerIp: Property.ShortText({
      displayName: 'Customer IP',
      description: 'The IPv4 or IPv6 address the customer paid from.',
      required: false,
    }),
    customerPhone: Property.ShortText({
      displayName: 'Customer Phone',
      required: false,
    }),
    additionalFields: Property.Json({
      displayName: 'Additional Fields',
      description: 'Any other Greip payment fields as a JSON object, e.g. {"billing_country": "US", "card_number": "424242"}. The fields above win over the same keys here.',
      required: false,
    }),
  },
  async run(context) {
    const { action, transactionId, transactionAmount, transactionCurrency, customerId, customerEmail, customerIp, customerPhone, additionalFields } =
      context.propsValue;
    return await greipClient.request({
      auth: context.auth,
      method: HttpMethod.POST,
      path: '/score/payments',
      body: {
        data: {
          ...additionalFields,
          ...(action ? { action } : {}),
          ...(transactionId ? { transaction_id: transactionId } : {}),
          ...(transactionAmount !== undefined ? { transaction_amount: transactionAmount } : {}),
          ...(transactionCurrency ? { transaction_currency: transactionCurrency } : {}),
          ...(customerId ? { customer_id: customerId } : {}),
          ...(customerEmail ? { customer_email: customerEmail } : {}),
          ...(customerIp ? { customer_ip: customerIp } : {}),
          ...(customerPhone ? { customer_phone: customerPhone } : {}),
        },
      },
    });
  },
});
