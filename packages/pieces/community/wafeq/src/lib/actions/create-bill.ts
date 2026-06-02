import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { wafeqAuth } from '../common/auth';
import { wafeqApiCall } from '../common/client';
import { wafeqProps, LineItemInput } from '../common/props';
import { wafeqHelpers } from '../common/helpers';

export const createBill = createAction({
  auth: wafeqAuth,
  name: 'create_bill',
  displayName: 'Create Bill',
  description:
    'Record a bill you received from a supplier (e.g. a vendor invoice you need to pay).',
  props: {
    contact: wafeqProps.contactDropdown({
      displayName: 'Supplier',
      description: 'Who sent you this bill? Pick from your Wafeq contacts.',
    }),
    bill_number: Property.ShortText({
      displayName: 'Bill Number',
      description:
        'The invoice number printed on the supplier\'s bill (so you can match it later). Must be unique per supplier in your Wafeq org.',
      required: true,
    }),
    bill_date: Property.DateTime({
      displayName: 'Bill Date',
      description: 'The date printed on the supplier\'s bill.',
      required: true,
    }),
    bill_due_date: Property.DateTime({
      displayName: 'Due Date',
      description: 'The date you need to pay this bill by.',
      required: true,
    }),
    currency: wafeqProps.currency(),
    default_account: wafeqProps.accountDropdown({
      displayName: 'Default Expense Account',
      description:
        'Where this cost is booked in your books (e.g. "Office Supplies", "Software Subscriptions"). Applied to every line item unless you override it on a specific line.',
      classification: 'EXPENSE',
    }),
    default_tax_rate: wafeqProps.taxRateDropdown({
      displayName: 'Default Tax Rate',
      description:
        'Tax applied to every line by default (e.g. "VAT 15% on purchases"). Leave blank if no tax.',
      required: false,
    }),
    line_items: wafeqProps.lineItemsArray,
    prices_include_tax: Property.StaticDropdown({
      displayName: 'Do the prices above include tax?',
      description:
        'If the supplier\'s prices already include tax, pick "Yes". If tax should be added on top, pick "No".',
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
        'Draft = still editable, not in your books yet. Authorized = approved and posted to your books. Start with Draft if unsure.',
      required: false,
      defaultValue: 'DRAFT',
      options: {
        options: [
          { label: 'Draft (recommended)', value: 'DRAFT' },
          { label: 'Authorized (posts to your books)', value: 'AUTHORIZED' },
        ],
      },
    }),
    reference: Property.ShortText({
      displayName: 'Reference',
      description: 'Optional free text (e.g. project name, department).',
      required: false,
    }),
    order_number: Property.ShortText({
      displayName: 'Your PO Number',
      description:
        'Optional. The purchase order number from your own system, if you issued one.',
      required: false,
    }),
    notes: Property.LongText({
      displayName: 'Internal Notes',
      description:
        'Optional notes visible in Wafeq. Not printed on anything and not shared with the supplier.',
      required: false,
    }),
    external_id: wafeqProps.externalId(),
    idempotency_key: wafeqProps.idempotencyKey,
  },
  async run(context) {
    const p = context.propsValue;
    const body = wafeqHelpers.stripEmpty({
      contact: p.contact,
      bill_number: p.bill_number,
      bill_date: wafeqHelpers.toDate(p.bill_date as string),
      bill_due_date: wafeqHelpers.toDate(p.bill_due_date as string),
      currency: p.currency,
      line_items: wafeqHelpers.mapLineItems({
        items: p.line_items as unknown as LineItemInput[],
        defaultAccount: p.default_account as string,
        defaultTaxRate: p.default_tax_rate as string | undefined,
      }),
      status: p.status,
      tax_amount_type: p.prices_include_tax,
      reference: p.reference,
      order_number: p.order_number,
      notes: p.notes,
      external_id: p.external_id,
    });
    const response = await wafeqApiCall<BillResponse>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/bills/',
      body,
      idempotencyKey: p.idempotency_key as string | undefined,
    });
    return flattenBill(response.body);
  },
});

function flattenBill(b: BillResponse): Record<string, unknown> {
  return {
    id: b.id,
    bill_number: b.bill_number,
    contact_id: b.contact ?? null,
    status: b.status ?? null,
    currency: b.currency,
    amount: b.amount,
    balance: b.balance ?? null,
    tax_amount: b.tax_amount ?? null,
    bill_date: b.bill_date,
    bill_due_date: b.bill_due_date,
    reference: b.reference ?? null,
    order_number: b.order_number ?? null,
    notes: b.notes ?? null,
    external_id: b.external_id ?? null,
    line_items_count: Array.isArray(b.line_items) ? b.line_items.length : 0,
    created_ts: b.created_ts ?? null,
    modified_ts: b.modified_ts ?? null,
  };
}

type BillResponse = {
  id: string;
  bill_number: string;
  contact?: string;
  status?: string;
  currency: string;
  amount: number;
  balance?: number;
  tax_amount?: number;
  bill_date: string;
  bill_due_date: string;
  reference?: string;
  order_number?: string;
  notes?: string;
  external_id?: string;
  line_items?: unknown[];
  created_ts?: string;
  modified_ts?: string;
};
