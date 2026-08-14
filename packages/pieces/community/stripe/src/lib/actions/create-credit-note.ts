import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { stripeAuth } from '../..';
import { stripeCommon } from '../common';

import { creditNoteOutputSchema } from '../output-schemas';
export const stripeCreateCreditNote = createAction({
  name: 'create_credit_note',
  auth: stripeAuth,
  displayName: 'Create Credit Note (Agent)',
  description: 'Issue a credit note against a finalized invoice.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Issues a credit note against a finalized invoice — a post-payment adjustment (credit, refund, or out-of-band amount). Supply either a total credit_amount or itemized lines (in the smallest currency unit). The invoice must already be finalized. Not idempotent: each call creates a new credit note.',
    idempotent: false,
  },
  props: {
    invoice: Property.ShortText({
      displayName: 'Invoice ID',
      description:
        'The finalized invoice ID (e.g., in_...) to credit. Obtain it from List/Search Invoices.',
      required: true,
    }),
    amount: Property.Number({
      displayName: 'Amount',
      description:
        'Total amount of the credit note, in the smallest currency unit (e.g., 500 for $5.00). Stripe requires this (or itemized lines); it must not exceed the invoice total. By default the full amount credits the customer balance unless you also set Credit Amount / Refund Amount to split it.',
      required: true,
    }),
    credit_amount: Property.Number({
      displayName: 'Credit Amount',
      description:
        'The amount to credit to the customer balance, in the smallest currency unit (e.g., 500 for $5.00).',
      required: false,
    }),
    refund_amount: Property.Number({
      displayName: 'Refund Amount',
      description:
        'The amount to refund, in the smallest currency unit. Refunds against the original payment.',
      required: false,
    }),
    reason: Property.StaticDropdown({
      displayName: 'Reason',
      required: false,
      options: {
        options: [
          { label: 'Duplicate', value: 'duplicate' },
          { label: 'Fraudulent', value: 'fraudulent' },
          { label: 'Order Change', value: 'order_change' },
          { label: 'Product Unsatisfactory', value: 'product_unsatisfactory' },
        ],
      },
    }),
    memo: Property.LongText({
      displayName: 'Memo',
      required: false,
    }),
  },
  outputSchema: creditNoteOutputSchema,
  async run(context) {
    const { invoice, amount, credit_amount, refund_amount, reason, memo } =
      context.propsValue;

    const body: { [key: string]: unknown } = { invoice };
    if (amount !== undefined && amount !== null) {
      body.amount = amount;
    }
    if (credit_amount !== undefined && credit_amount !== null) {
      body.credit_amount = credit_amount;
    }
    if (refund_amount !== undefined && refund_amount !== null) {
      body.refund_amount = refund_amount;
    }
    if (reason) body.reason = reason;
    if (memo) body.memo = memo;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${stripeCommon.baseUrl}/credit_notes`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.secret_text,
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });

    return response.body;
  },
});
