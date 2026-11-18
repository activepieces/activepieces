import { createAction, Property } from '@activepieces/pieces-framework';
import { odooAuth } from '../auth';
import { OdooClient } from '../common/client';
import { odooOperations } from '../common/operations';
import { odooProps } from '../common/props';
import { odooInput } from '../common/values';
import { findInvoicesOutputSchema } from '../output-schemas';

export const findInvoicesAction = createAction({
  auth: odooAuth,
  name: 'find_invoices',
  classification: 'SEARCH',
  displayName: 'Find Invoices',
  description: 'List invoices, bills and credit notes, filtered by type, status, customer and dates.',
  audience: 'human',
  aiMetadata: {
    description:
      'Searches Odoo invoices, vendor bills and credit notes (account.move) by type, status, payment status, partner (including its contacts), number and invoice/due date ranges, newest first with offset paging. Needs Invoicing. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: findInvoicesOutputSchema,
  props: {
    move_types: Property.StaticMultiSelectDropdown({
      displayName: 'Type',
      description: 'Leave empty for all four types.',
      required: false,
      options: {
        options: [
          { label: 'Customer invoice', value: 'out_invoice' },
          { label: 'Customer credit note', value: 'out_refund' },
          { label: 'Vendor bill', value: 'in_invoice' },
          { label: 'Vendor refund', value: 'in_refund' },
        ],
      },
    }),
    state: Property.StaticDropdown({
      displayName: 'Status',
      required: false,
      options: {
        options: [
          { label: 'Draft', value: 'draft' },
          { label: 'Posted', value: 'posted' },
          { label: 'Cancelled', value: 'cancel' },
        ],
      },
    }),
    payment_states: Property.StaticMultiSelectDropdown({
      displayName: 'Payment Status',
      required: false,
      options: {
        options: [
          { label: 'Not paid', value: 'not_paid' },
          { label: 'Partially paid', value: 'partial' },
          { label: 'In payment', value: 'in_payment' },
          { label: 'Paid', value: 'paid' },
          { label: 'Reversed', value: 'reversed' },
        ],
      },
    }),
    partner_id: odooProps.fixedModelDropdown({
      model: 'res.partner',
      displayName: 'Customer / Vendor',
      description: 'Optional. Includes invoices of its contacts.',
      required: false,
    }),
    number: Property.ShortText({ displayName: 'Number or Reference Contains', required: false }),
    invoice_date_from: Property.DateTime({ displayName: 'Invoice Date From', required: false }),
    invoice_date_to: Property.DateTime({ displayName: 'Invoice Date To', required: false }),
    due_date_from: Property.DateTime({ displayName: 'Due Date From', required: false }),
    due_date_to: Property.DateTime({ displayName: 'Due Date To', required: false }),
    limit: Property.Number({ displayName: 'Limit', description: 'Default 50, maximum 500.', required: false }),
    offset: Property.Number({ displayName: 'Offset', description: 'Skip this many invoices (for paging).', required: false }),
  },
  async run(context) {
    const p = context.propsValue;
    const client = OdooClient.fromAuth({ auth: context.auth.props });
    return odooOperations.findInvoices({
      client,
      filters: {
        move_types: odooInput.toStringList(p.move_types),
        state: odooInput.optionalText(p.state),
        payment_states: odooInput.toStringList(p.payment_states),
        partner_id: odooInput.optionalId({ value: p.partner_id, label: 'Customer / Vendor' }),
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
