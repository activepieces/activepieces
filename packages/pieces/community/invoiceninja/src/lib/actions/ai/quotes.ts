import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { invoiceninjaAuth } from '../../common/auth';
import { invoiceNinjaClient } from '../../common/client';
import { entityActions } from '../../common/entity-actions';
import { invoiceNinjaOutputSchemas } from '../../common/output-schemas';
import { invoiceNinjaProps } from '../../common/props';

const CLEARABLE = ['po_number', 'public_notes', 'private_notes', 'terms', 'due_date'] as const;

export const getQuote = entityActions.getAction({
  name: 'get_quote',
  entity: 'quotes',
  label: 'Quote',
  aiDescription: 'Returns one Invoice Ninja quote by its ID: status, amount, line items, portal links and, once converted, invoice_id. Read-only.',
  outputSchema: invoiceNinjaOutputSchemas.quote,
});

export const listQuotes = createAction({
  auth: invoiceninjaAuth,
  name: 'list_quotes',
  classification: 'SEARCH',
  displayName: 'List Quotes',
  description: 'List quotes with filters, one page at a time.',
  audience: 'ai',
  aiMetadata: {
    description: 'Lists Invoice Ninja quotes, optionally for one client, by quote state and free-text search. Returns {items, page, perPage, total, hasMore}. Read-only.',
    idempotent: true,
  },
  outputSchema: invoiceNinjaOutputSchemas.quoteList,
  props: {
    client_id: Property.ShortText({ displayName: 'Client ID', required: false }),
    quote_state: Property.StaticDropdown<string>({
      displayName: 'Quote State',
      required: false,
      options: {
        options: [
          { label: 'All', value: 'all' },
          { label: 'Draft', value: 'draft' },
          { label: 'Sent', value: 'sent' },
          { label: 'Approved', value: 'approved' },
          { label: 'Converted', value: 'converted' },
          { label: 'Expired', value: 'expired' },
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
      entity: 'quotes',
      page: propsValue.page,
      perPage: propsValue.per_page,
      query: {
        client_id: invoiceNinjaClient.optionalId({ value: propsValue.client_id, label: 'Client ID' }),
        client_status: propsValue.quote_state,
        filter: invoiceNinjaClient.optionalText(propsValue.search),
        status: propsValue.status,
        sort: propsValue.sort,
      },
    });
  },
});

export const createQuote = createAction({
  auth: invoiceninjaAuth,
  name: 'create_quote',
  classification: 'WRITE',
  displayName: 'Create Quote',
  description: 'Create a draft quote for a client from line items.',
  audience: 'ai',
  aiMetadata: {
    description: 'Creates a draft Invoice Ninja quote for client_id from line_items (product_key and/or notes, cost, quantity). due_date is the valid-until date (YYYY-MM-DD). Send it with Email Quote. Not idempotent: each call creates a new quote.',
    idempotent: false,
  },
  outputSchema: invoiceNinjaOutputSchemas.quote,
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
      await invoiceNinjaClient.request({ auth: auth.props, method: HttpMethod.POST, path: '/quotes', body }),
    );
  },
});

export const updateQuote = createAction({
  auth: invoiceninjaAuth,
  name: 'update_quote',
  classification: 'WRITE',
  displayName: 'Update Quote',
  description: 'Change fields of a quote. Empty fields are left unchanged.',
  audience: 'ai',
  aiMetadata: {
    description: 'Updates an Invoice Ninja quote by ID. Only fields you pass change; clear_fields blanks the listed ones; line_items, when given, REPLACES all lines. Returns the updated quote. Idempotent.',
    idempotent: true,
  },
  outputSchema: invoiceNinjaOutputSchemas.quote,
  props: {
    quote_id: Property.ShortText({ displayName: 'Quote ID', required: true }),
    line_items: invoiceNinjaProps.lineItems({ required: false }),
    ...invoiceNinjaProps.documentProps(),
    clear_fields: invoiceNinjaProps.clearProp({ fields: CLEARABLE }),
  },
  async run({ auth, propsValue }) {
    const id = invoiceNinjaClient.parseId({ value: propsValue.quote_id, label: 'Quote ID' });
    const body = invoiceNinjaClient.compact({
      ...invoiceNinjaClient.clearedFields({ value: propsValue.clear_fields, allowed: CLEARABLE }),
      ...invoiceNinjaProps.documentBody(propsValue),
      line_items: invoiceNinjaClient.lineItemsOf({ value: propsValue.line_items, label: 'Line Items', required: false }),
    });
    if (Object.keys(body).length === 0) {
      throw new Error('Nothing to update: give at least one field or clear_fields.');
    }
    return invoiceNinjaClient.recordOf(
      await invoiceNinjaClient.request({ auth: auth.props, method: HttpMethod.PUT, path: `/quotes/${id}`, body }),
    );
  },
});

export const emailQuote = entityActions.bulkAction({
  name: 'email_quote',
  entity: 'quotes',
  label: 'Quote',
  action: 'email',
  displayName: 'Email Quote',
  description: 'Email the quote to the client\'s contacts and mark it sent.',
  aiDescription: 'Emails an Invoice Ninja quote to the client contacts that receive email and marks a draft as sent. Not idempotent: each call sends another email.',
  classification: 'WRITE',
  idempotent: false,
  outputSchema: invoiceNinjaOutputSchemas.quote,
});

export const approveQuote = entityActions.bulkAction({
  name: 'approve_quote',
  entity: 'quotes',
  label: 'Quote',
  action: 'approve',
  displayName: 'Approve Quote',
  description: 'Mark a sent quote as approved on the client\'s behalf.',
  aiDescription: 'Approves an Invoice Ninja quote (status 3) on the client\'s behalf, including a draft quote. Idempotent.',
  classification: 'WRITE',
  idempotent: true,
  outputSchema: invoiceNinjaOutputSchemas.quote,
});

export const convertQuoteToInvoice = entityActions.bulkAction({
  name: 'convert_quote_to_invoice',
  entity: 'quotes',
  label: 'Quote',
  action: 'convert_to_invoice',
  displayName: 'Convert Quote to Invoice',
  description: 'Create an invoice from a quote.',
  aiDescription: 'Converts an Invoice Ninja quote into a new draft invoice; the returned quote has status 4 and invoice_id set to the new invoice (fetch it with Get Invoice). Calling it again on a converted quote fails and creates nothing.',
  classification: 'WRITE',
  idempotent: false,
  outputSchema: invoiceNinjaOutputSchemas.quote,
});

export const deleteQuote = entityActions.bulkAction({
  name: 'delete_quote',
  entity: 'quotes',
  label: 'Quote',
  action: 'delete',
  displayName: 'Delete Quote',
  description: 'Delete a quote (soft delete).',
  aiDescription: 'Deletes an Invoice Ninja quote by ID (soft delete, is_deleted true). Ask the user before calling. Deleting an already deleted quote fails.',
  classification: 'DESTRUCTIVE',
  idempotent: false,
  outputSchema: invoiceNinjaOutputSchemas.quote,
});
