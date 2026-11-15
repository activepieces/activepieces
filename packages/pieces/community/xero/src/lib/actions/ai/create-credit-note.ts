import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { xeroAuth } from '../../..';
import { XERO_URLS, xeroApi, xeroInput } from '../../common/client';
import { aiInput, aiProps } from '../../common/ai-props';
import { xeroOutputSchemas } from '../../output-schemas';

export const xeroCreateCreditNoteAi = createAction({
  auth: xeroAuth,
  name: 'xero_create_credit_note_ai',
  classification: 'WRITE',
  displayName: 'Create Credit Note',
  description: 'Creates a customer or supplier credit note for a contact ID with line items.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates a credit note for an existing ContactID: ACCRECCREDIT for a customer (reduces what they owe) or ACCPAYCREDIT for a supplier, with JSON line items; saved as DRAFT unless Status is SUBMITTED or AUTHORISED. Use Allocate Credit Note to Invoice afterwards to apply it. Not idempotent: each call creates another credit note.',
    idempotent: false,
  },
  outputSchema: xeroOutputSchemas.creditNote,
  props: {
    tenant_id: aiProps.tenantId(),
    type: Property.StaticDropdown({
      displayName: 'Type',
      required: true,
      options: { options: [{ label: 'Customer credit note (ACCRECCREDIT)', value: 'ACCRECCREDIT' }, { label: 'Supplier credit note (ACCPAYCREDIT)', value: 'ACCPAYCREDIT' }] },
    }),
    contact_id: aiProps.id({ displayName: 'Contact ID', description: 'Xero ContactID (a GUID).' }),
    line_items: aiProps.lineItems(),
    date: Property.ShortText({ displayName: 'Date (YYYY-MM-DD)', required: false }),
    reference: Property.ShortText({ displayName: 'Reference', required: false }),
    credit_note_number: Property.ShortText({ displayName: 'Credit Note Number', required: false }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      required: false,
      defaultValue: 'DRAFT',
      options: { options: [{ label: 'Draft', value: 'DRAFT' }, { label: 'Submitted for approval', value: 'SUBMITTED' }, { label: 'Authorised', value: 'AUTHORISED' }] },
    }),
    line_amount_types: Property.StaticDropdown({
      displayName: 'Line Amount Types',
      required: false,
      options: { options: [{ label: 'Tax exclusive', value: 'Exclusive' }, { label: 'Tax inclusive', value: 'Inclusive' }, { label: 'No tax', value: 'NoTax' }] },
    }),
    currency_code: Property.ShortText({ displayName: 'Currency Code', description: 'ISO code such as USD; defaults to the organisation base currency.', required: false }),
  },
  async run(context) {
    const values = context.propsValue;
    const contactId = xeroInput.requiredText({ value: values.contact_id, field: 'Contact ID' });
    const lineItems = aiInput.parseLineItems({ value: values.line_items });
    const date = xeroInput.parseDateInput({ value: values.date, field: 'Date' });
    const text = (value: unknown) => xeroInput.trimmedOrUndefined({ value });
    const { accessToken, tenantId } = await aiInput.target({ accessToken: context.auth.access_token, tenantId: values.tenant_id });
    const body = await xeroApi.request<unknown>({
      accessToken,
      tenantId,
      method: HttpMethod.PUT,
      url: `${XERO_URLS.api}/CreditNotes`,
      queryParams: { unitdp: '4' },
      body: {
        CreditNotes: [
          {
            Type: values.type,
            Contact: { ContactID: contactId },
            LineItems: lineItems,
            Status: values.status ?? 'DRAFT',
            ...(date ? { Date: date } : {}),
            ...(text(values.reference) ? { Reference: text(values.reference) } : {}),
            ...(text(values.credit_note_number) ? { CreditNoteNumber: text(values.credit_note_number) } : {}),
            ...(values.line_amount_types ? { LineAmountTypes: values.line_amount_types } : {}),
            ...(text(values.currency_code) ? { CurrencyCode: text(values.currency_code) } : {}),
          },
        ],
      },
      operation: 'create credit note',
    });
    return xeroApi.firstRecord({ body, key: 'CreditNotes', operation: 'create credit note' });
  },
});
