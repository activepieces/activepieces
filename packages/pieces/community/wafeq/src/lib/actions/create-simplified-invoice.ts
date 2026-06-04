import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { wafeqAuth } from '../common/auth';
import { wafeqApiCall } from '../common/client';
import { wafeqProps, LineItemInput } from '../common/props';
import { wafeqHelpers } from '../common/helpers';

export const createSimplifiedInvoice = createAction({
  auth: wafeqAuth,
  name: 'create_simplified_invoice',
  displayName: 'Create Simplified Invoice',
  description:
    'Create a simplified (retail) tax invoice — used for walk-in / over-the-counter sales, especially in Saudi Arabia under ZATCA. Use a regular invoice for B2B sales instead.',
  props: {
    invoice_date: Property.DateTime({
      displayName: 'Sale Date',
      description: 'The date the sale happened. Usually today.',
      required: true,
    }),
    currency: wafeqProps.currency(),
    paid_through_account: wafeqProps.accountDropdown({
      displayName: 'Where was the money received?',
      description:
        'Pick the bank, cash drawer, or POS account the customer paid into. Only payment-enabled accounts are shown.',
      paymentEnabledOnly: true,
    }),
    default_account: wafeqProps.accountDropdown({
      displayName: 'Default Sales Account',
      description:
        'Where the sale is booked (e.g. "Sales Revenue"). Applied to every line unless overridden.',
      classification: 'REVENUE',
    }),
    default_tax_rate: wafeqProps.taxRateDropdown({
      displayName: 'Default Tax Rate',
      description: 'Tax applied to every line by default (e.g. "VAT 15%").',
      required: false,
    }),
    line_items: wafeqProps.lineItemsArray,
    prices_include_tax: Property.StaticDropdown({
      displayName: 'Do the prices above include tax?',
      description:
        'Retail prices almost always include tax, so "Yes" is recommended.',
      required: false,
      defaultValue: 'TAX_INCLUSIVE',
      options: {
        options: [
          {
            label: 'Yes — prices already include tax (recommended for retail)',
            value: 'TAX_INCLUSIVE',
          },
          { label: 'No — add tax on top of the prices', value: 'TAX_EXCLUSIVE' },
        ],
      },
    }),
    contact: wafeqProps.contactDropdown({
      displayName: 'Customer (optional)',
      description:
        'Optional. Most simplified invoices are for walk-in customers and leave this blank.',
      required: false,
    }),
    invoice_number: Property.ShortText({
      displayName: 'Invoice Number (optional)',
      description: 'Leave blank to let Wafeq auto-generate one.',
      required: false,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'Paid = the sale is complete. Draft = not posted to books yet.',
      required: false,
      defaultValue: 'PAID',
      options: {
        options: [
          { label: 'Paid (recommended)', value: 'PAID' },
          { label: 'Draft', value: 'DRAFT' },
        ],
      },
    }),
    language: Property.StaticDropdown({
      displayName: 'Printed Language',
      required: false,
      defaultValue: 'en',
      options: {
        options: [
          { label: 'English', value: 'en' },
          { label: 'Arabic', value: 'ar' },
        ],
      },
    }),
    reference: Property.ShortText({
      displayName: 'Reference',
      description: 'Optional free text shown on the invoice.',
      required: false,
    }),
    notes: Property.LongText({
      displayName: 'Notes',
      description: 'Optional notes printed on the invoice.',
      required: false,
    }),
    external_id: wafeqProps.externalId(),
    idempotency_key: wafeqProps.idempotencyKey,
  },
  async run(context) {
    const p = context.propsValue;
    const body = wafeqHelpers.stripEmpty({
      invoice_date: wafeqHelpers.toDate(p.invoice_date as string),
      currency: p.currency,
      paid_through_account: p.paid_through_account,
      line_items: wafeqHelpers.mapLineItems({
        items: p.line_items as unknown as LineItemInput[],
        defaultAccount: p.default_account as string,
        defaultTaxRate: p.default_tax_rate as string | undefined,
      }),
      contact: p.contact,
      invoice_number: p.invoice_number,
      status: p.status,
      tax_amount_type: p.prices_include_tax,
      language: p.language,
      notes: p.notes,
      reference: p.reference,
      external_id: p.external_id,
    });
    const response = await wafeqApiCall<SimplifiedInvoiceResponse>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/simplified-invoices/',
      body,
      idempotencyKey: p.idempotency_key as string | undefined,
    });
    const inv = response.body;
    return {
      id: inv.id,
      invoice_number: inv.invoice_number ?? null,
      contact_id: inv.contact ?? null,
      status: inv.status ?? null,
      currency: inv.currency,
      amount: inv.amount,
      tax_amount: inv.tax_amount ?? null,
      invoice_date: inv.invoice_date,
      paid_through_account_id: inv.paid_through_account,
      language: inv.language ?? null,
      tax_amount_type: inv.tax_amount_type ?? null,
      reference: inv.reference ?? null,
      notes: inv.notes ?? null,
      external_id: inv.external_id ?? null,
      line_items_count: Array.isArray(inv.line_items) ? inv.line_items.length : 0,
      created_ts: inv.created_ts ?? null,
      modified_ts: inv.modified_ts ?? null,
    };
  },
});

type SimplifiedInvoiceResponse = {
  id: string;
  invoice_number?: string;
  contact?: string;
  status?: string;
  currency: string;
  amount: number;
  tax_amount?: number;
  invoice_date: string;
  paid_through_account: string;
  language?: string;
  tax_amount_type?: string;
  reference?: string;
  notes?: string;
  external_id?: string;
  line_items?: unknown[];
  created_ts?: string;
  modified_ts?: string;
};
