import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { wafeqAuth } from '../common/auth';
import { wafeqApiCall } from '../common/client';
import { wafeqProps, LineItemInput } from '../common/props';
import { wafeqHelpers } from '../common/helpers';

export const createCreditNote = createAction({
  auth: wafeqAuth,
  name: 'create_credit_note',
  displayName: 'Create Credit Note',
  description:
    'Issue a credit note to a customer — used when you refund them, correct an overcharge, or take back goods. A credit note reduces how much the customer owes you.',
  props: {
    contact: wafeqProps.contactDropdown({
      displayName: 'Customer',
      description: 'Which customer is the credit note for?',
    }),
    credit_note_number: Property.ShortText({
      displayName: 'Credit Note Number',
      description: 'A unique number for this credit note (e.g. CN-2024-001).',
      required: true,
    }),
    credit_note_date: Property.DateTime({
      displayName: 'Credit Note Date',
      description: 'The date shown on the credit note. Usually today.',
      required: true,
    }),
    currency: wafeqProps.currency(),
    default_account: wafeqProps.accountDropdown({
      displayName: 'Default Sales Account',
      description:
        'The sales account the credit reverses against (usually the same account the original invoice posted to). Applied to every line unless overridden per line.',
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
        'Draft = still editable. Sent = marked as sent to the customer. Finalized = locked and posted to your books.',
      required: false,
      defaultValue: 'DRAFT',
      options: {
        options: [
          { label: 'Draft (recommended)', value: 'DRAFT' },
          { label: 'Sent', value: 'SENT' },
          { label: 'Finalized (locked)', value: 'FINALIZED' },
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
      description: 'Optional text shown on the credit note (e.g. the original invoice number this refunds).',
      required: false,
    }),
    notes: Property.LongText({
      displayName: 'Notes / Message to Customer',
      description: 'Optional notes printed on the credit note (e.g. reason for the credit).',
      required: false,
    }),
    external_id: wafeqProps.externalId(),
    idempotency_key: wafeqProps.idempotencyKey,
  },
  async run(context) {
    const p = context.propsValue;
    const body = wafeqHelpers.stripEmpty({
      contact: p.contact,
      credit_note_number: p.credit_note_number,
      credit_note_date: wafeqHelpers.toDate(p.credit_note_date as string),
      currency: p.currency,
      line_items: wafeqHelpers.mapLineItems({
        items: p.line_items as unknown as LineItemInput[],
        defaultAccount: p.default_account as string,
        defaultTaxRate: p.default_tax_rate as string | undefined,
      }),
      status: p.status,
      tax_amount_type: p.prices_include_tax,
      language: p.language,
      reference: p.reference,
      notes: p.notes,
      external_id: p.external_id,
    });
    const response = await wafeqApiCall<CreditNoteResponse>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/credit-notes/',
      body,
      idempotencyKey: p.idempotency_key as string | undefined,
    });
    const cn = response.body;
    return {
      id: cn.id,
      credit_note_number: cn.credit_note_number,
      contact_id: cn.contact ?? null,
      status: cn.status ?? null,
      currency: cn.currency,
      amount: cn.amount,
      balance: cn.balance ?? null,
      tax_amount: cn.tax_amount ?? null,
      credit_note_date: cn.credit_note_date,
      language: cn.language ?? null,
      tax_amount_type: cn.tax_amount_type ?? null,
      reference: cn.reference ?? null,
      notes: cn.notes ?? null,
      external_id: cn.external_id ?? null,
      line_items_count: Array.isArray(cn.line_items) ? cn.line_items.length : 0,
      created_ts: cn.created_ts ?? null,
      modified_ts: cn.modified_ts ?? null,
    };
  },
});

type CreditNoteResponse = {
  id: string;
  credit_note_number: string;
  contact?: string;
  status?: string;
  currency: string;
  amount: number;
  balance?: number;
  tax_amount?: number;
  credit_note_date: string;
  language?: string;
  tax_amount_type?: string;
  reference?: string;
  notes?: string;
  external_id?: string;
  line_items?: unknown[];
  created_ts?: string;
  modified_ts?: string;
};
