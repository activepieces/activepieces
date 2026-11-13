import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { invoiceninjaAuth } from '../../common/auth';
import { invoiceNinjaClient } from '../../common/client';
import { entityActions } from '../../common/entity-actions';
import { invoiceNinjaOutputSchemas } from '../../common/output-schemas';

export const getPayment = createAction({
  auth: invoiceninjaAuth,
  name: 'get_payment',
  classification: 'READ',
  displayName: 'Get Payment',
  description: 'Get one payment by its ID.',
  audience: 'ai',
  aiMetadata: {
    description: 'Returns one Invoice Ninja payment by ID with amount, refunded amount and the invoices it is applied to. Read-only.',
    idempotent: true,
  },
  outputSchema: invoiceNinjaOutputSchemas.payment,
  props: { id: entityActions.getIdProp('Payment') },
  async run({ auth, propsValue }) {
    return entityActions.runGet({ auth: auth.props, entity: 'payments', label: 'Payment', id: propsValue.id });
  },
});

export const listPayments = createAction({
  auth: invoiceninjaAuth,
  name: 'list_payments',
  classification: 'SEARCH',
  displayName: 'List Payments',
  description: 'List payments, one page at a time.',
  audience: 'ai',
  aiMetadata: {
    description: 'Lists Invoice Ninja payments, optionally for one client and by free-text search (number, reference). Returns {items, page, perPage, total, hasMore}. Read-only.',
    idempotent: true,
  },
  outputSchema: invoiceNinjaOutputSchemas.paymentList,
  props: {
    client_id: Property.ShortText({ displayName: 'Client ID', required: false }),
    search: Property.ShortText({ displayName: 'Search', required: false }),
    status: entityActions.statusProp(),
    sort: entityActions.sortProp(),
    ...entityActions.listProps(),
  },
  async run({ auth, propsValue }) {
    return entityActions.runList({
      auth: auth.props,
      entity: 'payments',
      page: propsValue.page,
      perPage: propsValue.per_page,
      query: {
        client_id: invoiceNinjaClient.optionalId({ value: propsValue.client_id, label: 'Client ID' }),
        filter: invoiceNinjaClient.optionalText(propsValue.search),
        status: propsValue.status,
        sort: propsValue.sort,
      },
    });
  },
});

export const createPayment = createAction({
  auth: invoiceninjaAuth,
  name: 'create_payment',
  classification: 'WRITE',
  displayName: 'Create Payment',
  description: 'Record a manual payment from a client, optionally applied to an invoice.',
  audience: 'ai',
  aiMetadata: {
    description: 'Records a manual payment for client_id in Invoice Ninja. With invoice_id the whole amount is applied to that invoice (it must not exceed the invoice balance); without it the amount becomes unapplied client credit. date is YYYY-MM-DD (default today). Not idempotent: each call records another payment.',
    idempotent: false,
  },
  outputSchema: invoiceNinjaOutputSchemas.payment,
  props: {
    client_id: Property.ShortText({ displayName: 'Client ID', required: true }),
    amount: Property.Number({ displayName: 'Amount', required: true }),
    invoice_id: Property.ShortText({ displayName: 'Invoice ID', description: 'Apply the payment to this invoice.', required: false }),
    date: Property.ShortText({ displayName: 'Date', description: 'YYYY-MM-DD. Default today.', required: false }),
    transaction_reference: Property.ShortText({ displayName: 'Transaction Reference', required: false }),
    private_notes: Property.LongText({ displayName: 'Private Notes', required: false }),
  },
  async run({ auth, propsValue }) {
    const amount = invoiceNinjaClient.optionalNumber({ value: propsValue.amount, label: 'Amount', min: 0.01 });
    if (amount === undefined) throw new Error('Amount is required.');
    const invoiceId = invoiceNinjaClient.optionalId({ value: propsValue.invoice_id, label: 'Invoice ID' });
    const body = invoiceNinjaClient.compact({
      client_id: invoiceNinjaClient.parseId({ value: propsValue.client_id, label: 'Client ID' }),
      amount,
      date: invoiceNinjaClient.toDateOnly({ value: propsValue.date, label: 'Date' }),
      transaction_reference: invoiceNinjaClient.optionalText(propsValue.transaction_reference),
      private_notes: invoiceNinjaClient.optionalText(propsValue.private_notes),
      invoices: invoiceId === undefined ? undefined : [{ invoice_id: invoiceId, amount }],
    });
    return invoiceNinjaClient.recordOf(
      await invoiceNinjaClient.request({ auth: auth.props, method: HttpMethod.POST, path: '/payments', body }),
    );
  },
});

export const refundPayment = createAction({
  auth: invoiceninjaAuth,
  name: 'refund_payment',
  classification: 'DESTRUCTIVE',
  displayName: 'Refund Payment',
  description: 'Record a refund of a payment in Invoice Ninja (no money is moved at a payment gateway).',
  audience: 'ai',
  aiMetadata: {
    description: 'Records a refund on an Invoice Ninja payment: amount (default: everything not yet refunded) is taken back from the invoices the payment was applied to, oldest allocation first, and their balances reopen. If part of the payment is unapplied credit, refund the invoice part first; the call fails with the amounts to use, and a second call refunds the credit. It never refunds through a payment gateway and sends no email. Not idempotent: each call refunds again until nothing is left.',
    idempotent: false,
  },
  outputSchema: invoiceNinjaOutputSchemas.payment,
  props: {
    payment_id: Property.ShortText({ displayName: 'Payment ID', required: true }),
    amount: Property.Number({ displayName: 'Amount', description: 'Default: the whole unrefunded amount.', required: false }),
  },
  async run({ auth, propsValue }) {
    const id = invoiceNinjaClient.parseId({ value: propsValue.payment_id, label: 'Payment ID' });
    const payment = await invoiceNinjaClient.getRecord({ auth: auth.props, entity: 'payments', id });
    const paid = numberOf(payment['amount']);
    const refunded = numberOf(payment['refunded']);
    const available = round(paid - refunded);
    const amount = invoiceNinjaClient.optionalNumber({ value: propsValue.amount, label: 'Amount', min: 0.01 }) ?? available;
    if (available <= 0) throw new Error(`Payment ${id} is already fully refunded.`);
    if (amount > available) throw new Error(`Amount ${amount} is more than the refundable ${available} of payment ${id}.`);
    const invoices = allocate({ paymentables: invoiceNinjaClient.arrayOf(payment['paymentables']), amount });
    const allocated = round(invoices.reduce((sum, row) => sum + row.amount, 0));
    if (invoices.length > 0 && allocated < amount) {
      throw new Error(
        `Payment ${id} has only ${allocated} left on its invoices; the other ${round(available - allocated)} is unapplied credit. Refund ${allocated} first, then call again for the credit.`,
      );
    }
    const body = invoiceNinjaClient.compact({
      id,
      amount,
      date: new Date().toISOString().slice(0, 10),
      gateway_refund: false,
      send_email: false,
      invoices: invoices.length > 0 ? invoices : undefined,
    });
    return invoiceNinjaClient.recordOf(
      await invoiceNinjaClient.request({ auth: auth.props, method: HttpMethod.POST, path: '/payments/refund', body }),
    );
  },
});

export const deletePayment = createAction({
  auth: invoiceninjaAuth,
  name: 'delete_payment',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Payment',
  description: 'Delete a payment (reopens the invoices it paid).',
  audience: 'ai',
  aiMetadata: {
    description: 'Deletes an Invoice Ninja payment by ID (soft delete); invoices it paid get their balance back. Use Refund Payment to record money returned instead. Ask the user before calling.',
    idempotent: false,
  },
  outputSchema: invoiceNinjaOutputSchemas.payment,
  props: { id: entityActions.bulkIdProp('Payment') },
  async run({ auth, propsValue }) {
    return entityActions.runBulk({ auth: auth.props, entity: 'payments', label: 'Payment', action: 'delete', id: propsValue.id });
  },
});

function numberOf(value: unknown): number {
  const parsed = typeof value === 'string' ? Number(value) : value;
  return typeof parsed === 'number' && Number.isFinite(parsed) ? parsed : 0;
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

function allocate({ paymentables, amount }: { paymentables: unknown[]; amount: number }): { invoice_id: string; amount: number }[] {
  const open = paymentables
    .filter(invoiceNinjaClient.isRecord)
    .filter((row) => typeof row['invoice_id'] === 'string' && row['invoice_id'] !== '')
    .map((row) => ({ invoice_id: String(row['invoice_id']), left: round(numberOf(row['amount']) - numberOf(row['refunded'])) }))
    .filter((row) => row.left > 0);
  return open.reduce<{ rest: number; rows: { invoice_id: string; amount: number }[] }>(
    (acc, row) => {
      if (acc.rest <= 0) return acc;
      const take = round(Math.min(acc.rest, row.left));
      return { rest: round(acc.rest - take), rows: [...acc.rows, { invoice_id: row.invoice_id, amount: take }] };
    },
    { rest: amount, rows: [] },
  ).rows;
}
