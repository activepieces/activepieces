import {
  createAction,
  DynamicPropsValue,
  Property,
} from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { wafeqAuth } from '../common/auth';
import { wafeqApiCall, WafeqPaginatedResponse } from '../common/client';
import { wafeqProps } from '../common/props';
import { wafeqHelpers } from '../common/helpers';

export const recordPayment = createAction({
  auth: wafeqAuth,
  name: 'record_payment',
  displayName: 'Record Payment',
  description:
    'Record money received from a customer (paying an invoice) or money sent to a supplier (paying a bill).',
  props: {
    payment_for: Property.StaticDropdown({
      displayName: 'What is this payment for?',
      description:
        'Pick what the money was used to pay. "Advanced" lets you split a single payment across multiple invoices or bills.',
      required: true,
      defaultValue: 'invoice',
      options: {
        options: [
          { label: 'An invoice (customer paid me)', value: 'invoice' },
          { label: 'A bill (I paid a supplier)', value: 'bill' },
          { label: 'A credit note', value: 'credit_note' },
          {
            label: 'Advanced — split across multiple documents',
            value: 'advanced',
          },
        ],
      },
    }),
    target: Property.DynamicProperties({
      auth: wafeqAuth,
      displayName: 'Paying',
      required: true,
      refreshers: ['payment_for'],
      props: async ({ auth, payment_for }): Promise<DynamicPropsValue> => {
        const pick = payment_for as unknown as string;
        if (!auth) return {};
        const authKey = auth.secret_text as string;
        if (pick === 'invoice') {
          return { invoice: await buildInvoiceDropdown(authKey) };
        }
        if (pick === 'bill') {
          return { bill: await buildBillDropdown(authKey) };
        }
        if (pick === 'credit_note') {
          return { credit_note: await buildCreditNoteDropdown(authKey) };
        }
        if (pick === 'advanced') {
          return {
            allocations: Property.Array({
              displayName: 'Allocations',
              description:
                "Add one row per document you're paying. The amounts should add up to the total Amount below.",
              required: true,
              properties: {
                type: Property.StaticDropdown({
                  displayName: 'Type',
                  required: true,
                  defaultValue: 'invoice',
                  options: {
                    options: [
                      { label: 'Invoice', value: 'invoice' },
                      { label: 'Bill', value: 'bill' },
                      { label: 'Credit note', value: 'credit_note' },
                    ],
                  },
                }),
                target_id: Property.ShortText({
                  displayName: 'Document ID',
                  description:
                    'Paste the invoice / bill / credit note ID (from a previous Create action).',
                  required: true,
                }),
                amount: Property.Number({
                  displayName: 'Amount Applied',
                  description:
                    "How much of the payment goes to this document, in the document's own currency.",
                  required: true,
                }),
              },
            }),
          };
        }
        return {};
      },
    }),
    amount: Property.Number({
      displayName: 'Total Amount Paid',
      description:
        'The full amount of the payment, including any fees. For a simple single-document payment, this should match the unpaid balance.',
      required: true,
    }),
    amount_to_pcy: Property.Number({
      displayName: 'Amount in Company Currency',
      description:
        'The amount in the payment currency. Must be greater than zero.',
      required: true,
    }),
    currency: wafeqProps.currency(),

    date: Property.DateTime({
      displayName: 'Payment Date',
      description:
        'When the payment was made or received. Use the date on your bank statement.',
      required: true,
    }),
    paid_through_account: wafeqProps.accountDropdown({
      displayName: 'Paid Through Account',
      description:
        'Which bank, cash, or card account the money moved through. Only payment-enabled accounts are shown.',
      paymentEnabledOnly: true,
    }),
    contact: wafeqProps.contactDropdown({
      displayName: 'Contact (optional)',
      description:
        'Optional. The customer or supplier this payment is with. Usually auto-detected from the document.',
      required: false,
    }),
    payment_fees: Property.Number({
      displayName: 'Payment Fees (optional)',
      description:
        'Optional. Any bank or card processing fees deducted from the payment (e.g. Stripe fee). Leave blank if none.',
      required: false,
    }),
    payment_fees_account: wafeqProps.accountDropdown({
      displayName: 'Fees Account',
      description:
        'Only needed if you entered Payment Fees above. Pick the expense account the fees are booked to (e.g. "Bank Charges").',
      required: false,
      classification: 'EXPENSE',
    }),
    reference: Property.ShortText({
      displayName: 'Reference',
      description:
        'Optional. A bank transaction ID or any note you want to attach.',
      required: false,
    }),
    external_id: wafeqProps.externalId(),
    idempotency_key: wafeqProps.idempotencyKey,
  },
  async run(context) {
    const p = context.propsValue;
    const target = p.target ?? {};
    const paymentFor = p.payment_for as string;

    let invoicePayments: Record<string, unknown>[] | undefined;
    let billPayments: Record<string, unknown>[] | undefined;
    let creditNotePayments: Record<string, unknown>[] | undefined;

    if (paymentFor === 'invoice' && target['invoice']) {
      invoicePayments = [
        {
          invoice: target['invoice'],
          amount: p.amount,
          amount_to_pcy: p.amount_to_pcy,
        },
      ];
    } else if (paymentFor === 'bill' && target['bill']) {
      billPayments = [
        {
          bill: target['bill'],
          amount: p.amount,
          amount_to_pcy: p.amount_to_pcy,
        },
      ];
    } else if (paymentFor === 'credit_note' && target['credit_note']) {
      creditNotePayments = [
        {
          credit_note: target['credit_note'],
          amount: p.amount,
          amount_to_pcy: p.amount_to_pcy,
        },
      ];
    } else if (paymentFor === 'advanced') {
      const allocations =
        (target['allocations'] as AdvancedAllocation[] | undefined) ?? [];
      invoicePayments = buildAllocationList(allocations, 'invoice');
      billPayments = buildAllocationList(allocations, 'bill');
      creditNotePayments = buildAllocationList(allocations, 'credit_note');
    }

    const body = wafeqHelpers.stripEmpty({
      amount: p.amount,
      currency: p.currency,
      date: wafeqHelpers.toDate(p.date as string),
      paid_through_account: p.paid_through_account,
      contact: p.contact,
      invoice_payments: invoicePayments,
      bill_payments: billPayments,
      credit_note_payments: creditNotePayments,
      payment_fees: p.payment_fees,
      payment_fees_account: p.payment_fees_account,
      reference: p.reference,
      external_id: p.external_id,
    });
    const response = await wafeqApiCall<PaymentResponse>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/payments/',
      body,
      idempotencyKey: p.idempotency_key as string | undefined,
    });
    return flattenPayment(response.body);
  },
});

async function buildInvoiceDropdown(authKey: string) {
  const response = await wafeqApiCall<
    WafeqPaginatedResponse<{
      id: string;
      invoice_number: string;
      amount: number;
      currency: string;
      balance?: number;
    }>
  >({
    apiKey: authKey,
    method: HttpMethod.GET,
    path: '/invoices/',
    queryParams: { page_size: '100' },
  });
  return Property.StaticDropdown({
    displayName: 'Invoice Being Paid',
    description: 'Pick the invoice this payment settles.',
    required: true,
    options: {
      options: response.body.results.map((i) => ({
        label: `#${i.invoice_number} — ${i.currency} ${i.amount}${
          i.balance != null ? ` (${i.currency} ${i.balance} unpaid)` : ''
        }`,
        value: i.id,
      })),
    },
  });
}

async function buildBillDropdown(authKey: string) {
  const response = await wafeqApiCall<
    WafeqPaginatedResponse<{
      id: string;
      bill_number: string;
      amount: number;
      currency: string;
      balance?: number;
    }>
  >({
    apiKey: authKey,
    method: HttpMethod.GET,
    path: '/bills/',
    queryParams: { page_size: '100' },
  });
  return Property.StaticDropdown({
    displayName: 'Bill Being Paid',
    description: 'Pick the bill this payment settles.',
    required: true,
    options: {
      options: response.body.results.map((b) => ({
        label: `#${b.bill_number} — ${b.currency} ${b.amount}${
          b.balance != null ? ` (${b.currency} ${b.balance} unpaid)` : ''
        }`,
        value: b.id,
      })),
    },
  });
}

async function buildCreditNoteDropdown(authKey: string) {
  const response = await wafeqApiCall<
    WafeqPaginatedResponse<{
      id: string;
      credit_note_number: string;
      amount: number;
      currency: string;
    }>
  >({
    apiKey: authKey,
    method: HttpMethod.GET,
    path: '/credit-notes/',
    queryParams: { page_size: '100' },
  });
  return Property.StaticDropdown({
    displayName: 'Credit Note',
    description: 'Pick the credit note to apply.',
    required: true,
    options: {
      options: response.body.results.map((c) => ({
        label: `#${c.credit_note_number} — ${c.currency} ${c.amount}`,
        value: c.id,
      })),
    },
  });
}

function buildAllocationList(
  allocations: AdvancedAllocation[],
  type: 'invoice' | 'bill' | 'credit_note'
): Record<string, unknown>[] | undefined {
  const matches = allocations
    .filter((a) => a.type === type && a.target_id && a.amount != null)
    .map((a) => ({
      [type]: a.target_id,
      amount: a.amount,
      amount_to_pcy: a.amount_to_pcy ?? a.amount,
    }));
  return matches.length > 0 ? matches : undefined;
}

function flattenPayment(p: PaymentResponse): Record<string, unknown> {
  return {
    id: p.id,
    amount: p.amount,
    currency: p.currency,
    date: p.date,
    contact_id: p.contact ?? null,
    paid_through_account_id: p.paid_through_account,
    payment_fees: p.payment_fees ?? null,
    reference: p.reference ?? null,
    external_id: p.external_id ?? null,
    invoice_payments_count: Array.isArray(p.invoice_payments)
      ? p.invoice_payments.length
      : 0,
    bill_payments_count: Array.isArray(p.bill_payments)
      ? p.bill_payments.length
      : 0,
    credit_note_payments_count: Array.isArray(p.credit_note_payments)
      ? p.credit_note_payments.length
      : 0,
    created_ts: p.created_ts ?? null,
    modified_ts: p.modified_ts ?? null,
  };
}

type AdvancedAllocation = {
  type: 'invoice' | 'bill' | 'credit_note';
  target_id: string;
  amount: number;
  amount_to_pcy?: number;
};

type PaymentResponse = {
  id: string;
  amount: number;
  currency: string;
  date: string;
  contact?: string;
  paid_through_account: string;
  payment_fees?: number;
  reference?: string;
  external_id?: string;
  invoice_payments?: unknown[];
  bill_payments?: unknown[];
  credit_note_payments?: unknown[];
  created_ts?: string;
  modified_ts?: string;
};
