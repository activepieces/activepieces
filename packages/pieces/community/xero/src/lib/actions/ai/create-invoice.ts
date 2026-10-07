import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { xeroAuth } from '../../..';
import { XERO_URLS, xeroApi, xeroInput } from '../../common/client';
import { aiInput, aiProps } from '../../common/ai-props';
import { xeroOutputSchemas } from '../../output-schemas';

export const xeroCreateInvoiceAi = createAction({
  auth: xeroAuth,
  name: 'xero_create_invoice_ai',
  classification: 'WRITE',
  displayName: 'Create Invoice or Bill',
  description: 'Creates a sales invoice or a supplier bill for a contact ID with line items.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates one sales invoice (Type ACCREC) or supplier bill (Type ACCPAY) for an existing ContactID with JSON line items, saved as DRAFT unless Status says SUBMITTED or AUTHORISED. Resolve the contact with Find Contact and account codes with List Accounts first; use Update Invoice to change an existing one. Not idempotent: each call creates another invoice, so pass a unique Reference and check Search Invoices before retrying.',
    idempotent: false,
  },
  outputSchema: xeroOutputSchemas.invoice,
  props: {
    tenant_id: aiProps.tenantId(),
    type: Property.StaticDropdown({
      displayName: 'Type',
      required: true,
      options: { options: [{ label: 'Sales invoice (ACCREC)', value: 'ACCREC' }, { label: 'Bill (ACCPAY)', value: 'ACCPAY' }] },
    }),
    contact_id: aiProps.id({ displayName: 'Contact ID', description: 'Xero ContactID (a GUID) of the customer or supplier.' }),
    line_items: aiProps.lineItems(),
    date: Property.ShortText({ displayName: 'Date (YYYY-MM-DD)', description: 'Invoice date; Xero uses today when empty.', required: false }),
    due_date: Property.ShortText({ displayName: 'Due Date (YYYY-MM-DD)', description: 'Required by Xero before the invoice can be approved.', required: false }),
    reference: Property.ShortText({ displayName: 'Reference', required: false }),
    invoice_number: Property.ShortText({ displayName: 'Invoice Number', description: 'Leave empty to let Xero number sales invoices automatically.', required: false }),
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
    branding_theme_id: Property.ShortText({ displayName: 'Branding Theme ID', required: false }),
  },
  async run(context) {
    const values = context.propsValue;
    const contactId = xeroInput.requiredText({ value: values.contact_id, field: 'Contact ID' });
    const lineItems = aiInput.parseLineItems({ value: values.line_items });
    const date = xeroInput.parseDateInput({ value: values.date, field: 'Date' });
    const dueDate = xeroInput.parseDateInput({ value: values.due_date, field: 'Due Date' });
    const text = (value: unknown) => xeroInput.trimmedOrUndefined({ value });
    const { accessToken, tenantId } = await aiInput.target({ accessToken: context.auth.access_token, tenantId: values.tenant_id });
    const body = await xeroApi.request<unknown>({
      accessToken,
      tenantId,
      method: HttpMethod.PUT,
      url: `${XERO_URLS.api}/Invoices`,
      queryParams: { unitdp: '4' },
      body: {
        Invoices: [
          {
            Type: values.type,
            Contact: { ContactID: contactId },
            LineItems: lineItems,
            Status: values.status ?? 'DRAFT',
            ...(date ? { Date: date } : {}),
            ...(dueDate ? { DueDate: dueDate } : {}),
            ...(text(values.reference) ? { Reference: text(values.reference) } : {}),
            ...(text(values.invoice_number) ? { InvoiceNumber: text(values.invoice_number) } : {}),
            ...(values.line_amount_types ? { LineAmountTypes: values.line_amount_types } : {}),
            ...(text(values.currency_code) ? { CurrencyCode: text(values.currency_code) } : {}),
            ...(text(values.branding_theme_id) ? { BrandingThemeID: text(values.branding_theme_id) } : {}),
          },
        ],
      },
      operation: 'create invoice',
    });
    return xeroApi.firstRecord({ body, key: 'Invoices', operation: 'create invoice' });
  },
});
