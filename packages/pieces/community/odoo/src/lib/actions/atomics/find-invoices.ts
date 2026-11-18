import { createAction, Property } from '@activepieces/pieces-framework';
import { odooAuth } from '../../auth';
import { OdooClient } from '../../common/client';
import { odooOperations } from '../../common/operations';
import { odooInput } from '../../common/values';
import { atomicProps } from './common';
import { atomicSchemas } from './output-schemas';

export const odooFindInvoices = createAction({
  auth: odooAuth,
  name: 'odoo_find_invoices',
  classification: 'SEARCH',
  displayName: 'Find Invoices',
  description: 'Search Odoo invoices, bills and credit notes.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Searches Odoo invoices, vendor bills and credit notes (account.move) by type, status, payment status, partner (including its contacts), number/reference text and invoice or due date ranges, newest first with offset paging. Use for unpaid or overdue invoice questions. Needs Invoicing. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: atomicSchemas.invoices,
  props: {
    move_types: Property.Array({ displayName: 'Types', description: 'Any of out_invoice, in_invoice, out_refund, in_refund. Omit for all four.', required: false }),
    state: Property.StaticDropdown({
      displayName: 'Status',
      description: 'draft, posted or cancel. Omit for all.',
      required: false,
      options: { options: [{ label: 'Draft', value: 'draft' }, { label: 'Posted', value: 'posted' }, { label: 'Cancelled', value: 'cancel' }] },
    }),
    payment_states: Property.Array({
      displayName: 'Payment Statuses',
      description: 'Any of not_paid, partial, in_payment, paid, reversed (blocked on 18+). For unpaid use ["not_paid", "partial"].',
      required: false,
    }),
    partner_id: atomicProps.optionalIdProp({ displayName: 'Partner ID', description: 'res.partner ID; includes its contacts.' }),
    number: atomicProps.textProp({ displayName: 'Number or Reference Contains', description: 'For example INV/2026/0007.' }),
    invoice_date_from: atomicProps.textProp({ displayName: 'Invoice Date From', description: 'Date, for example 2026-09-01.' }),
    invoice_date_to: atomicProps.textProp({ displayName: 'Invoice Date To', description: 'Date.' }),
    due_date_from: atomicProps.textProp({ displayName: 'Due Date From', description: 'Date.' }),
    due_date_to: atomicProps.textProp({ displayName: 'Due Date To', description: 'Date. For overdue invoices use yesterday.' }),
    limit: atomicProps.limitProp({ fallback: 50, max: 500 }),
    offset: atomicProps.offsetProp(),
  },
  async run(context) {
    const p = context.propsValue;
    const allowedTypes = ['out_invoice', 'in_invoice', 'out_refund', 'in_refund'];
    const moveTypes = odooInput.toStringList(p.move_types);
    const bad = moveTypes.filter((t) => !allowedTypes.includes(t));
    if (bad.length > 0) throw new Error(`Unknown invoice type(s): ${bad.join(', ')}. Use ${allowedTypes.join(', ')}.`);
    const client = OdooClient.fromAuth({ auth: context.auth.props });
    return odooOperations.findInvoices({
      client,
      filters: {
        move_types: moveTypes,
        state: odooInput.optionalText(p.state),
        payment_states: odooInput.toStringList(p.payment_states),
        partner_id: odooInput.optionalId({ value: p.partner_id, label: 'Partner ID' }),
        number: p.number,
        invoice_date_from: p.invoice_date_from,
        invoice_date_to: p.invoice_date_to,
        due_date_from: p.due_date_from,
        due_date_to: p.due_date_to,
      },
      limit: odooInput.clampLimit({ value: p.limit, fallback: 50, max: 500 }),
      offset: odooInput.toOffset(p.offset),
    });
  },
});
