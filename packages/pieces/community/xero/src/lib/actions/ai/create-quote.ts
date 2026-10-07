import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { xeroAuth } from '../../..';
import { XERO_URLS, xeroApi, xeroInput } from '../../common/client';
import { aiInput, aiProps } from '../../common/ai-props';
import { xeroOutputSchemas } from '../../output-schemas';

export const xeroCreateQuoteAi = createAction({
  auth: xeroAuth,
  name: 'xero_create_quote_ai',
  classification: 'WRITE',
  displayName: 'Create Quote',
  description: 'Creates a quote for a contact ID with line items.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates a sales quote for an existing customer ContactID with a quote date and JSON line items, plus optional title, summary, terms and expiry date; saved as DRAFT unless Status is SENT. Not idempotent: each call creates another quote, so check before retrying.',
    idempotent: false,
  },
  outputSchema: xeroOutputSchemas.quote,
  props: {
    tenant_id: aiProps.tenantId(),
    contact_id: aiProps.id({ displayName: 'Contact ID', description: 'Xero ContactID (a GUID) of the customer.' }),
    date: Property.ShortText({ displayName: 'Quote Date (YYYY-MM-DD)', required: true }),
    line_items: aiProps.lineItems(),
    expiry_date: Property.ShortText({ displayName: 'Expiry Date (YYYY-MM-DD)', required: false }),
    reference: Property.ShortText({ displayName: 'Reference', required: false }),
    quote_number: Property.ShortText({ displayName: 'Quote Number', required: false }),
    title: Property.ShortText({ displayName: 'Title', required: false }),
    summary: Property.LongText({ displayName: 'Summary', required: false }),
    terms: Property.LongText({ displayName: 'Terms', required: false }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      required: false,
      defaultValue: 'DRAFT',
      options: { options: [{ label: 'Draft', value: 'DRAFT' }, { label: 'Sent', value: 'SENT' }] },
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
    const date = xeroInput.parseDateInput({ value: values.date, field: 'Quote Date' });
    if (!date) throw new Error('Quote Date is required.');
    const lineItems = aiInput.parseLineItems({ value: values.line_items });
    const expiryDate = xeroInput.parseDateInput({ value: values.expiry_date, field: 'Expiry Date' });
    const text = (value: unknown) => xeroInput.trimmedOrUndefined({ value });
    const { accessToken, tenantId } = await aiInput.target({ accessToken: context.auth.access_token, tenantId: values.tenant_id });
    const body = await xeroApi.request<unknown>({
      accessToken,
      tenantId,
      method: HttpMethod.PUT,
      url: `${XERO_URLS.api}/Quotes`,
      queryParams: { unitdp: '4' },
      body: {
        Quotes: [
          {
            Contact: { ContactID: contactId },
            Date: date,
            LineItems: lineItems,
            Status: values.status ?? 'DRAFT',
            ...(expiryDate ? { ExpiryDate: expiryDate } : {}),
            ...(text(values.reference) ? { Reference: text(values.reference) } : {}),
            ...(text(values.quote_number) ? { QuoteNumber: text(values.quote_number) } : {}),
            ...(text(values.title) ? { Title: text(values.title) } : {}),
            ...(text(values.summary) ? { Summary: text(values.summary) } : {}),
            ...(text(values.terms) ? { Terms: text(values.terms) } : {}),
            ...(values.line_amount_types ? { LineAmountTypes: values.line_amount_types } : {}),
            ...(text(values.currency_code) ? { CurrencyCode: text(values.currency_code) } : {}),
          },
        ],
      },
      operation: 'create quote',
    });
    return xeroApi.firstRecord({ body, key: 'Quotes', operation: 'create quote' });
  },
});
