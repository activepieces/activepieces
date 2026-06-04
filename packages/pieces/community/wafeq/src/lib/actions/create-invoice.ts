import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { wafeqAuth } from '../common/auth';
import { wafeqApiCall } from '../common/client';
import { wafeqProps, LineItemInput } from '../common/props';
import { wafeqHelpers } from '../common/helpers';

export const createInvoice = createAction({
  auth: wafeqAuth,
  name: 'create_invoice',
  displayName: 'Create Invoice',
  description: 'Create a new sales invoice for a customer.',
  props: {
    contact: wafeqProps.contactDropdown({
      displayName: 'Customer',
      description: 'Who are you billing? Pick from your Wafeq contacts.',
    }),
    invoice_number: Property.ShortText({
      displayName: 'Invoice Number',
      description:
        'A unique number for this invoice (e.g. INV-2024-001). If you reuse a number, Wafeq will reject the invoice.',
      required: true,
    }),
    invoice_date: Property.DateTime({
      displayName: 'Invoice Date',
      description: 'The date shown on the invoice. Usually today.',
      required: true,
    }),
    invoice_due_date: Property.DateTime({
      displayName: 'Due Date',
      description: 'The date you expect to be paid by.',
      required: true,
    }),
    currency: wafeqProps.currency(),
    default_account: wafeqProps.accountDropdown({
      displayName: 'Default Sales Account',
      description:
        'Where the money from this invoice is booked (e.g. "Sales Revenue"). This is applied to every line item unless you override it on a specific line.',
      classification: 'REVENUE',
    }),
    default_tax_rate: wafeqProps.taxRateDropdown({
      displayName: 'Default Tax Rate',
      description:
        'Tax applied to every line by default (e.g. "VAT 15%"). Leave blank if this invoice has no tax.',
      required: false,
    }),
    line_items: wafeqProps.lineItemsArray,
    prices_include_tax: Property.StaticDropdown({
      displayName: 'Do the prices above include tax?',
      description:
        'If you already baked tax into the unit prices, pick "Yes". If tax should be added on top of the prices, pick "No". Most B2B invoices use "No".',
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
        'Draft = still editable, not posted to your books yet. Sent = emailed to the customer. Finalized = locked and posted to your books. Start with Draft if unsure.',
      required: false,
      defaultValue: 'DRAFT',
      options: {
        options: [
          { label: 'Draft (recommended — you can still edit)', value: 'DRAFT' },
          { label: 'Sent', value: 'SENT' },
          { label: 'Finalized (locked, posts to books)', value: 'FINALIZED' },
        ],
      },
    }),
    language: Property.StaticDropdown({
      displayName: 'Printed Language',
      description: 'Language used on the PDF invoice sent to the customer.',
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
      description:
        'Optional text printed on the invoice (e.g. a project name or the customer\'s PO number).',
      required: false,
    }),
    notes: Property.LongText({
      displayName: 'Notes / Message to Customer',
      description:
        'Optional notes printed at the bottom of the invoice (e.g. payment instructions, thank-you note).',
      required: false,
    }),
    external_id: wafeqProps.externalId('Your Reference ID'),
    idempotency_key: wafeqProps.idempotencyKey,
  },
  async run(context) {
    const p = context.propsValue;
    const body = wafeqHelpers.stripEmpty({
      contact: p.contact,
      invoice_number: p.invoice_number,
      invoice_date: wafeqHelpers.toDate(p.invoice_date as string),
      invoice_due_date: wafeqHelpers.toDate(p.invoice_due_date as string),
      currency: p.currency,
      line_items: wafeqHelpers.mapLineItems({
        items: p.line_items as unknown as LineItemInput[],
        defaultAccount: p.default_account as string,
        defaultTaxRate: p.default_tax_rate as string | undefined,
      }),
      status: p.status,
      language: p.language,
      tax_amount_type: p.prices_include_tax,
      notes: p.notes,
      reference: p.reference,
      external_id: p.external_id,
    });
    const response = await wafeqApiCall<InvoiceResponse>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/invoices/',
      body,
      idempotencyKey: p.idempotency_key as string | undefined,
    });
    return flattenInvoice(response.body);
  },
});

function flattenInvoice(inv: InvoiceResponse): Record<string, unknown> {
  return {
    id: inv.id,
    invoice_number: inv.invoice_number,
    contact_id: inv.contact ?? null,
    status: inv.status ?? null,
    currency: inv.currency,
    amount: inv.amount,
    balance: inv.balance ?? null,
    tax_amount: inv.tax_amount ?? null,
    invoice_date: inv.invoice_date,
    invoice_due_date: inv.invoice_due_date,
    language: inv.language ?? null,
    tax_amount_type: inv.tax_amount_type ?? null,
    reference: inv.reference ?? null,
    notes: inv.notes ?? null,
    external_id: inv.external_id ?? null,
    line_items_count: Array.isArray(inv.line_items) ? inv.line_items.length : 0,
    created_ts: inv.created_ts ?? null,
    modified_ts: inv.modified_ts ?? null,
  };
}

type InvoiceResponse = {
  id: string;
  invoice_number: string;
  contact?: string;
  status?: string;
  currency: string;
  amount: number;
  balance?: number;
  tax_amount?: number;
  invoice_date: string;
  invoice_due_date: string;
  language?: string;
  tax_amount_type?: string;
  reference?: string;
  notes?: string;
  external_id?: string;
  line_items?: unknown[];
  created_ts?: string;
  modified_ts?: string;
};
