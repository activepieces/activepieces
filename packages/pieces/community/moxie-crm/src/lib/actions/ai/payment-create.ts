import { Property, createAction } from '@activepieces/pieces-framework';
import { moxieCRMAuth } from '../../auth';
import { credentialsOf } from '../../common';
import { PAYMENT_TYPE_OPTIONS } from '../../common/fields';
import { moxieOperations } from '../../common/operations';
import { moxieActionOutputSchemas } from '../../output-schemas';

export const moxiePaymentCreateAction = createAction({
  auth: moxieCRMAuth,
  name: 'moxie_payment_create',
  classification: 'WRITE',
  displayName: 'Record Payment',
  description: 'Records a payment against an open Moxie invoice.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Records a payment on an open (sent, not fully paid) invoice matched by formatted invoice number and exact client name. With a Reference Number, the action first checks the invoice and returns it with already_applied true instead of recording the same payment twice; this check is best-effort, since Moxie has no idempotency key, so two runs started at the same moment can both record it. If the first run paid the invoice in full, the invoice is no longer open and a repeat run fails with a not-found error instead of paying twice. Use to sync payments from another system; find invoices with Search Open Invoices. Not idempotent without a Reference Number.',
    idempotent: false,
  },
  outputSchema: moxieActionOutputSchemas.payment,
  props: {
    invoiceNumber: Property.ShortText({
      displayName: 'Invoice Number',
      description: 'Formatted invoice number, for example E-2026-042, from Search Open Invoices.',
      required: true,
    }),
    clientName: Property.ShortText({
      displayName: 'Client Name',
      description: 'Exact name of the client the invoice belongs to.',
      required: true,
    }),
    amount: Property.Number({
      displayName: 'Amount',
      description: 'Payment amount, more than 0.',
      required: true,
    }),
    date: Property.ShortText({
      displayName: 'Payment Date',
      description: 'Date in YYYY-MM-DD format. Leave empty to use the Moxie default.',
      required: false,
    }),
    paymentType: Property.StaticDropdown({
      displayName: 'Payment Method',
      required: false,
      options: {
        disabled: false,
        options: PAYMENT_TYPE_OPTIONS.map((option) => ({ label: option, value: option })),
      },
    }),
    referenceNumber: Property.ShortText({
      displayName: 'Reference Number',
      description: 'External payment reference. Also used to skip a payment that was already recorded.',
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
