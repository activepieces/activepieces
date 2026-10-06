import { Property, createAction } from '@activepieces/pieces-framework';
import { moxieCRMAuth } from '../auth';
import { credentialsOf } from '../common';
import { moxieDropdowns } from '../common/dropdowns';
import { PAYMENT_TYPE_OPTIONS } from '../common/fields';
import { moxieOperations } from '../common/operations';
import { moxieActionOutputSchemas } from '../output-schemas';

export const moxieApplyPaymentAction = createAction({
  auth: moxieCRMAuth,
  name: 'moxie_apply_payment',
  classification: 'WRITE',
  displayName: 'Record Payment',
  description: 'Record a payment against an open invoice.',
  audience: 'human',
  aiMetadata: {
    description:
      'Records a payment on an open Moxie invoice picked by client and invoice; with a Reference Number a repeat run returns the invoice with already_applied true while it is still open (best-effort: two runs at the same moment can both record it), and fails with not-found once it is fully paid, instead of paying twice. For agents use moxie_payment_create. Not idempotent without a Reference Number.',
    idempotent: false,
  },
  outputSchema: moxieActionOutputSchemas.payment,
  props: {
    clientName: moxieDropdowns.clientName({ required: true }),
    invoiceNumber: moxieDropdowns.payableInvoice({ required: true }),
    amount: Property.Number({
      displayName: 'Amount',
      required: true,
    }),
    date: Property.ShortText({
      displayName: 'Payment Date',
      description: 'Date in YYYY-MM-DD format.',
      required: false,
    }),
    paymentType: Property.StaticDropdown({
      displayName: 'Payment Method',
      required: false,
      options: {
        disabled: false,
        options: PAYMENT_TYPE_OPTIONS.map((option) => ({ label: option.replace(/_/g, ' '), value: option })),
      },
    }),
    referenceNumber: Property.ShortText({
      displayName: 'Reference Number',
      description: 'External payment reference, such as a bank or Stripe id. A repeat run with the same reference is skipped.',
      required: false,
    }),
    memo: Property.ShortText({
      displayName: 'Memo',
      description: 'Free-text note on the payment.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    return moxieOperations.applyPayment({ credentials: credentialsOf({ auth }), values: propsValue });
  },
});
