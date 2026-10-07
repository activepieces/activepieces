import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { xeroAuth } from '../../..';
import { XERO_URLS, xeroApi, xeroInput } from '../../common/client';
import { aiInput, aiProps } from '../../common/ai-props';
import { xeroOutputSchemas } from '../../output-schemas';

export const xeroAllocateCreditNoteAi = createAction({
  auth: xeroAuth,
  name: 'xero_allocate_credit_note_ai',
  classification: 'WRITE',
  displayName: 'Allocate Credit Note to Invoice',
  description: 'Applies part or all of a credit note to an invoice or bill.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Applies an amount from an AUTHORISED credit note (CreditNoteID) to an AUTHORISED invoice or bill of the same contact (InvoiceID), reducing what is due. The amount cannot exceed the remaining credit or the amount due. Not idempotent: each call allocates again, and allocations cannot be removed through the API.',
    idempotent: false,
  },
  outputSchema: xeroOutputSchemas.allocation,
  props: {
    tenant_id: aiProps.tenantId(),
    credit_note_id: aiProps.id({ displayName: 'Credit Note ID', description: 'Xero CreditNoteID (a GUID).' }),
    invoice_id: aiProps.id({ displayName: 'Invoice ID', description: 'Xero InvoiceID (a GUID) to apply the credit to.' }),
    amount: Property.Number({ displayName: 'Amount', description: 'Amount to allocate, up to 2 decimal places.', required: true }),
    date: Property.ShortText({ displayName: 'Date (YYYY-MM-DD)', description: 'Defaults to today in Xero.', required: false }),
  },
  async run(context) {
    const values = context.propsValue;
    const creditNoteId = xeroInput.requiredText({ value: values.credit_note_id, field: 'Credit Note ID' });
    const invoiceId = xeroInput.requiredText({ value: values.invoice_id, field: 'Invoice ID' });
    const amount = xeroInput.parseDecimal({ value: values.amount, field: 'Amount', maxDecimals: 2, positive: true });
    const date = xeroInput.parseDateInput({ value: values.date, field: 'Date' });
    const { accessToken, tenantId } = await aiInput.target({ accessToken: context.auth.access_token, tenantId: values.tenant_id });
    const body = await xeroApi.request<unknown>({
      accessToken,
      tenantId,
      method: HttpMethod.PUT,
      url: `${XERO_URLS.api}/CreditNotes/${encodeURIComponent(creditNoteId)}/Allocations`,
      body: { Allocations: [{ Invoice: { InvoiceID: invoiceId }, Amount: amount, ...(date ? { Date: date } : {}) }] },
      operation: 'allocate credit note',
    });
    return xeroApi.firstRecord({ body, key: 'Allocations', operation: 'allocate credit note' });
  },
});
