import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { wafeqAuth } from '../common/auth';
import { wafeqApiCall } from '../common/client';
import { wafeqProps, LineItemInput } from '../common/props';
import { wafeqHelpers } from '../common/helpers';

export const createQuote = createAction({
  auth: wafeqAuth,
  name: 'create_quote',
  displayName: 'Create Quote',
  description:
    'Send a customer a quote (also called an estimate). Quotes can later be converted into an invoice with the "Convert Quote to Invoice" action.',
  props: {
    contact: wafeqProps.contactDropdown({
      displayName: 'Customer',
      description: 'Who is the quote for?',
    }),
    quote_number: Property.ShortText({
      displayName: 'Quote Number',
      description:
        'A unique number for this quote (e.g. QT-2024-001). Must not reuse an existing quote number.',
      required: true,
    }),
    quote_date: Property.DateTime({
      displayName: 'Quote Date',
      description: 'The date shown on the quote. Usually today.',
      required: true,
    }),
    currency: wafeqProps.currency(),
    default_account: wafeqProps.accountDropdown({
      displayName: 'Default Sales Account',
      description:
        'Where the revenue is booked when this quote becomes an invoice. Applied to every line unless overridden per line.',
      classification: 'REVENUE',
    }),
    default_tax_rate: wafeqProps.taxRateDropdown({
      displayName: 'Default Tax Rate',
      description: 'Tax applied to every line by default. Leave blank for no tax.',
      required: false,
    }),
    line_items: wafeqProps.lineItemsArray,
    prices_include_tax: Property.StaticDropdown({
      displayName: 'Do the prices above include tax?',
      description:
        'Pick "Yes" if the prices already include tax, "No" if tax should be added on top.',
      required: false,
      defaultValue: 'TAX_EXCLUSIVE',
      options: {
        options: [
          { label: 'No — add tax on top of the prices', value: 'TAX_EXCLUSIVE' },
          { label: 'Yes — prices already include tax', value: 'TAX_INCLUSIVE' },
        ],
      },
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description:
        'Draft = still editable. Sent = marked as sent to the customer. Start with Draft if unsure.',
      required: false,
      defaultValue: 'DRAFT',
      options: {
        options: [
          { label: 'Draft (recommended)', value: 'DRAFT' },
          { label: 'Sent', value: 'SENT' },
        ],
      },
    }),
    language: Property.StaticDropdown({
      displayName: 'Printed Language',
      description: 'Language used on the quote PDF.',
      required: false,
      defaultValue: 'en',
      options: {
        options: [
          { label: 'English', value: 'en' },
          { label: 'Arabic', value: 'ar' },
        ],
      },
    }),
    purchase_order: Property.ShortText({
      displayName: "Customer's PO Number",
      description:
        'Optional. If the customer sent you a purchase order number, enter it here so it appears on the quote.',
      required: false,
    }),
    reference: Property.ShortText({
      displayName: 'Reference',
      description: 'Optional free text shown on the quote (e.g. project name).',
      required: false,
    }),
    notes: Property.LongText({
      displayName: 'Notes / Message to Customer',
      description: 'Optional notes printed at the bottom of the quote.',
      required: false,
    }),
    external_id: wafeqProps.externalId(),
    idempotency_key: wafeqProps.idempotencyKey,
  },
  async run(context) {
    const p = context.propsValue;
    const body = wafeqHelpers.stripEmpty({
      contact: p.contact,
      quote_number: p.quote_number,
      quote_date: wafeqHelpers.toDate(p.quote_date as string),
      currency: p.currency,
      line_items: wafeqHelpers.mapLineItems({
        items: p.line_items as unknown as LineItemInput[],
        defaultAccount: p.default_account as string,
        defaultTaxRate: p.default_tax_rate as string | undefined,
      }),
      status: p.status,
      tax_amount_type: p.prices_include_tax,
      language: p.language,
      purchase_order: p.purchase_order,
      notes: p.notes,
      reference: p.reference,
      external_id: p.external_id,
    });
    const response = await wafeqApiCall<QuoteResponse>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/quotes/',
      body,
      idempotencyKey: p.idempotency_key as string | undefined,
    });
    const q = response.body;
    return {
      id: q.id,
      quote_number: q.quote_number,
      contact_id: q.contact ?? null,
      status: q.status ?? null,
      currency: q.currency,
      amount: q.amount,
      tax_amount: q.tax_amount ?? null,
      quote_date: q.quote_date,
      language: q.language ?? null,
      tax_amount_type: q.tax_amount_type ?? null,
      purchase_order: q.purchase_order ?? null,
      reference: q.reference ?? null,
      notes: q.notes ?? null,
      external_id: q.external_id ?? null,
      line_items_count: Array.isArray(q.line_items) ? q.line_items.length : 0,
      created_ts: q.created_ts ?? null,
      modified_ts: q.modified_ts ?? null,
    };
  },
});

type QuoteResponse = {
  id: string;
  quote_number: string;
  contact?: string;
  status?: string;
  currency: string;
  amount: number;
  tax_amount?: number;
  quote_date: string;
  language?: string;
  tax_amount_type?: string;
  purchase_order?: string;
  reference?: string;
  notes?: string;
  external_id?: string;
  line_items?: unknown[];
  created_ts?: string;
  modified_ts?: string;
};
