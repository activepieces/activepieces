import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { invoiceninjaAuth } from '../../common/auth';
import { invoiceNinjaClient } from '../../common/client';
import { entityActions } from '../../common/entity-actions';
import { invoiceNinjaOutputSchemas } from '../../common/output-schemas';
import { invoiceNinjaProps } from '../../common/props';

const CLEARABLE = ['po_number', 'public_notes', 'private_notes', 'terms', 'due_date'] as const;

export const getInvoice = entityActions.getAction({
  name: 'get_invoice',
  entity: 'invoices',
  label: 'Invoice',
  aiDescription: 'Returns one Invoice Ninja invoice by its ID: status, amounts, balance, line items and client portal links. Read-only.',
  outputSchema: invoiceNinjaOutputSchemas.invoice,
});

export const listInvoices = createAction({
  auth: invoiceninjaAuth,
  name: 'list_invoices',
  classification: 'SEARCH',
  displayName: 'List Invoices',
  description: 'List invoices with filters, one page at a time.',
  audience: 'ai',
  aiMetadata: {
    description: 'Lists Invoice Ninja invoices, optionally for one client, by payment state (paid, unpaid, overdue) and free-text search (number, PO, notes). Returns {items, page, perPage, total, hasMore}; ask for the next page while hasMore is true. Read-only.',
    idempotent: true,
  },
  outputSchema: invoiceNinjaOutputSchemas.invoiceList,
  props: {
    client_id: Property.ShortText({ displayName: 'Client ID', required: false }),
    payment_state: Property.StaticDropdown<string>({
      displayName: 'Payment State',
      required: false,
      options: {
        options: [
          { label: 'All', value: 'all' },
          { label: 'Draft', value: 'draft' },
          { label: 'Paid', value: 'paid' },
          { label: 'Unpaid', value: 'unpaid' },
          { label: 'Overdue', value: 'overdue' },
        ],
      },
    }),
    search: Property.ShortText({ displayName: 'Search', required: false }),
    status: entityActions.statusProp(),
    sort: entityActions.sortProp(),
    ...entityActions.listProps(),
  },
  async run({ auth, propsValue }) {
    return entityActions.runList({
      auth: auth.props,
      entity: 'invoices',
      page: propsValue.page,
      perPage: propsValue.per_page,
      query: {
        client_id: invoiceNinjaClient.optionalId({ value: propsValue.client_id, label: 'Client ID' }),
        client_status: propsValue.payment_state,
        filter: invoiceNinjaClient.optionalText(propsValue.search),
        status: propsValue.status,
        sort: propsValue.sort,
      },
    });
  },
});

export const createInvoiceAi = createAction({
  auth: invoiceninjaAuth,
  name: 'create_invoice_ai',
  classification: 'WRITE',
  displayName: 'Create Invoice (from line items)',
  description: 'Create a draft invoice for a client from explicit line items.',
  audience: 'ai',
  aiMetadata: {
    description: 'Creates a draft Invoice Ninja invoice for client_id with the given line_items (each: product_key and/or notes, cost, quantity, optional discount and tax). Dates are YYYY-MM-DD; date defaults to today. Does not send it: use Email Invoice or Mark Invoice Sent afterwards. Not idempotent: every call creates a new invoice.',
    idempotent: false,
  },
  outputSchema: invoiceNinjaOutputSchemas.invoice,
  props: {
    client_id: Property.ShortText({ displayName: 'Client ID', required: true }),
    line_items: invoiceNinjaProps.lineItems({ required: true }),
    ...invoiceNinjaProps.documentProps(),
  },
  async run({ auth, propsValue }) {
    const body = {
      ...invoiceNinjaProps.documentBody(propsValue),
      client_id: invoiceNinjaClient.parseId({ value: propsValue.client_id, label: 'Client ID' }),
      line_items: invoiceNinjaClient.lineItemsOf({ value: propsValue.line_items, label: 'Line Items', required: true }),
    };
    return invoiceNinjaClient.recordOf(
      await invoiceNinjaClient.request({ auth: auth.props, method: HttpMethod.POST, path: '/invoices', body }),
    );
  },
});

export const updateInvoice = createAction({
  auth: invoiceninjaAuth,
  name: 'update_invoice',
  classification: 'WRITE',
  displayName: 'Update Invoice',
  description: 'Change fields of an invoice. Empty fields are left unchanged.',
  audience: 'ai',
  aiMetadata: {
    description: 'Updates an Invoice Ninja invoice by ID. Only fields you pass change; clear_fields blanks the listed ones. line_items, when given, REPLACES all existing lines. Returns the updated invoice. Idempotent.',
    idempotent: true,
  },
  outputSchema: invoiceNinjaOutputSchemas.invoice,
  props: {
    invoice_id: Property.ShortText({ displayName: 'Invoice ID', required: true }),
    line_items: invoiceNinjaProps.lineItems({ required: false }),
    ...invoiceNinjaProps.documentProps(),
    clear_fields: invoiceNinjaProps.clearProp({ fields: CLEARABLE }),
  },
  async run({ auth, propsValue }) {
    const id = invoiceNinjaClient.parseId({ value: propsValue.invoice_id, label: 'Invoice ID' });
    const body = invoiceNinjaClient.compact({
      ...invoiceNinjaClient.clearedFields({ value: propsValue.clear_fields, allowed: CLEARABLE }),
      ...invoiceNinjaProps.documentBody(propsValue),
      line_items: invoiceNinjaClient.lineItemsOf({ value: propsValue.line_items, label: 'Line Items', required: false }),
    });
    if (Object.keys(body).length === 0) {
      throw new Error('Nothing to update: give at least one field or clear_fields.');
    }
    return invoiceNinjaClient.recordOf(
      await invoiceNinjaClient.request({ auth: auth.props, method: HttpMethod.PUT, path: `/invoices/${id}`, body }),
    );
  },
});

export const emailInvoice = entityActions.bulkAction({
  name: 'email_invoice',
  entity: 'invoices',
  label: 'Invoice',
  action: 'email',
  displayName: 'Email Invoice',
  description: 'Email the invoice to the client\'s contacts and mark it sent.',
  aiDescription: 'Emails an Invoice Ninja invoice to the client contacts that receive email, using the company template, and marks a draft as sent. Not idempotent: each call sends another email.',
  classification: 'WRITE',
  idempotent: false,
  outputSchema: invoiceNinjaOutputSchemas.invoice,
});

export const markInvoiceSent = entityActions.bulkAction({
  name: 'mark_invoice_sent',
  entity: 'invoices',
  label: 'Invoice',
  action: 'mark_sent',
  displayName: 'Mark Invoice Sent',
  description: 'Mark a draft invoice as sent without emailing it.',
  aiDescription: 'Marks an Invoice Ninja draft invoice as sent (status 2) without sending email, which makes its balance due. Idempotent.',
  classification: 'WRITE',
  idempotent: true,
  outputSchema: invoiceNinjaOutputSchemas.invoice,
});

export const markInvoicePaid = entityActions.bulkAction({
  name: 'mark_invoice_paid',
  entity: 'invoices',
  label: 'Invoice',
  action: 'mark_paid',
  displayName: 'Mark Invoice Paid',
  description: 'Record a payment for the full balance and mark the invoice paid.',
  aiDescription: 'Marks an Invoice Ninja invoice as paid by creating a manual payment for its whole remaining balance (status 4). Use Create Payment for partial amounts. Calling it on an invoice that is already paid fails with "cannot be marked as paid" and creates nothing.',
  classification: 'WRITE',
  idempotent: false,
  outputSchema: invoiceNinjaOutputSchemas.invoice,
});

export const archiveInvoice = entityActions.bulkAction({
  name: 'archive_invoice',
  entity: 'invoices',
  label: 'Invoice',
  action: 'archive',
  displayName: 'Archive Invoice',
  description: 'Archive an invoice (can be restored).',
  aiDescription: 'Archives an Invoice Ninja invoice by ID; restore it with Restore Invoice. Idempotent.',
  classification: 'WRITE',
  idempotent: true,
  outputSchema: invoiceNinjaOutputSchemas.invoice,
});

export const restoreInvoice = entityActions.bulkAction({
  name: 'restore_invoice',
  entity: 'invoices',
  label: 'Invoice',
  action: 'restore',
  displayName: 'Restore Invoice',
  description: 'Restore an archived or deleted invoice.',
  aiDescription: 'Restores an archived or deleted Invoice Ninja invoice by ID back to active. Idempotent.',
  classification: 'WRITE',
  idempotent: true,
  outputSchema: invoiceNinjaOutputSchemas.invoice,
});

export const deleteInvoice = entityActions.bulkAction({
  name: 'delete_invoice',
  entity: 'invoices',
  label: 'Invoice',
  action: 'delete',
  displayName: 'Delete Invoice',
  description: 'Delete an invoice (soft delete).',
  aiDescription: 'Deletes an Invoice Ninja invoice by ID (soft delete, is_deleted true). Restore Invoice brings it back. Ask the user before calling. Deleting an already deleted invoice fails.',
  classification: 'DESTRUCTIVE',
  idempotent: false,
  outputSchema: invoiceNinjaOutputSchemas.invoice,
});
