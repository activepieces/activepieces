import { createAction, Property } from '@activepieces/pieces-framework';
import { outsetaAuth } from '../auth';
import { OutsetaClient } from '../common/client';

export const processPaymentAction = createAction({
  name: 'process_payment',
  auth: outsetaAuth,
  displayName: 'Process Payment',
  description:
    "Manually trigger the processing (retry) of a previously recorded payment. Typically used to retry a failed payment after a customer updates their card.",
  audience: 'both',
  aiMetadata: {
    description:
      'Triggers (re)processing of an existing payment by its payment UID, e.g. to retry a declined charge after a card update. Use to collect a previously recorded payment; to log a manual payment against an invoice use Add Invoice Payment. Not idempotent: a successful retry can capture funds, so repeating may charge again.',
    idempotent: false,
  },
  props: {
    paymentUid: Property.ShortText({
      displayName: 'Payment UID',
      description:
        "The UID of the payment to process. You can get it from a 'Subscription Payment Declined' webhook payload, or from the 'List Account Transactions' / 'Get Last Payment for Account' actions.",
      required: true,
    }),
  },
  async run(context) {
    const client = new OutsetaClient({
      domain: context.auth.props.domain,
      apiKey: context.auth.props.apiKey,
      apiSecret: context.auth.props.apiSecret,
    });

    const result = await client.post<unknown>(
      `/api/v1/billing/payments/${context.propsValue.paymentUid}/processpayment`,
      {}
    );

    return {
      payment_uid: context.propsValue.paymentUid,
      processed: true,
      response: result,
    };
  },
});
