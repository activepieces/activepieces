import { createAction, Property } from '@activepieces/pieces-framework';
import { outsetaAuth } from '../auth';
import { OutsetaClient } from '../common/client';

export const updatePaymentInformationAction = createAction({
  name: 'update_payment_information',
  auth: outsetaAuth,
  displayName: 'Update Payment Information',
  description:
    "Update the credit card / payment method on an account. The payment processor tokens (CustomerToken, PaymentToken) must come from your payment processor (e.g. Stripe Elements) — not from Outseta.",
  audience: 'both',
  aiMetadata: {
    description:
      'Sets the payment method on an account from processor tokens (CustomerToken/PaymentToken), by account UID. Use to attach or replace a card; the tokens must come from your payment processor (e.g. Stripe), not Outseta. Idempotent: re-sending the same tokens yields the same stored method.',
    idempotent: true,
  },
  props: {
    accountUid: Property.ShortText({
      displayName: 'Account UID',
      description: 'The UID of the account to update payment information for.',
      required: true,
    }),
    customerToken: Property.ShortText({
      displayName: 'Customer Token',
      required: true,
      description: 'The customer ID issued by the payment processor (e.g. Stripe customer ID, "cust_…").',
    }),
    paymentToken: Property.ShortText({
      displayName: 'Payment Token',
      required: true,
      description: 'The payment method ID issued by the payment processor (e.g. Stripe payment method, "pm_…").',
    }),
    nameOnCard: Property.ShortText({
      displayName: 'Name on Card',
      required: false,
      description: 'Cardholder name as it appears on the card.',
    }),
  },
  async run(context) {
    const client = new OutsetaClient({
      domain: context.auth.props.domain,
      apiKey: context.auth.props.apiKey,
      apiSecret: context.auth.props.apiSecret,
    });

    const body: Record<string, unknown> = {
      Account: { Uid: context.propsValue.accountUid },
      CustomerToken: context.propsValue.customerToken,
      PaymentToken: context.propsValue.paymentToken,
    };
    if (context.propsValue.nameOnCard) {
      body['NameOnCard'] = context.propsValue.nameOnCard;
    }

    return client.post<unknown>('/api/v1/billing/paymentinformation', body);
  },
});
