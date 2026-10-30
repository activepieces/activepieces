import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { invoiceninjaAuth } from '../../common/auth';
import { invoiceNinjaClient } from '../../common/client';
import { entityActions } from '../../common/entity-actions';
import { invoiceNinjaOutputSchemas } from '../../common/output-schemas';
import { invoiceNinjaProps } from '../../common/props';

const CLEARABLE = ['po_number', 'public_notes', 'private_notes', 'terms', 'due_date'] as const;

export const getQuote = createAction({
  auth: invoiceninjaAuth,
  name: 'get_quote',
  classification: 'READ',
  displayName: 'Get Quote',
  description: 'Get one quote by its ID.',
  audience: 'ai',
  aiMetadata: {
    description: 'Returns one Invoice Ninja quote by its ID: status, amount, line items, portal links and, once converted, invoice_id. Read-only.',
    idempotent: true,
  },
  outputSchema: invoiceNinjaOutputSchemas.quote,
  props: { id: entityActions.getIdProp('Quote') },
  async run({ auth, propsValue }) {
    return entityActions.runGet({ auth: auth.props, entity: 'quotes', label: 'Quote', id: propsValue.id });
  },
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
      line_items: invoiceNinjaClient.lineItemsOf({ value: propsValue.line_items, label: 'Line Items', required: true, isAmountDiscount: invoiceNinjaClient.parseBoolean(propsValue.is_amount_discount) }),
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
      line_items: invoiceNinjaClient.lineItemsOf({ value: propsValue.line_items, label: 'Line Items', required: false, isAmountDiscount: invoiceNinjaClient.parseBoolean(propsValue.is_amount_discount) }),
    });
    if (Object.keys(body).length === 0) {
      throw new Error('Nothing to update: give at least one field or clear_fields.');
    }
    return invoiceNinjaClient.recordOf(
      await invoiceNinjaClient.request({ auth: auth.props, method: HttpMethod.PUT, path: `/quotes/${id}`, body }),
    );
  },
});

export const emailQuote = createAction({
  auth: invoiceninjaAuth,
  name: 'email_quote',
  classification: 'WRITE',
  displayName: 'Email Quote',
  description: 'Email the quote to the client\'s contacts and mark it sent.',
  audience: 'ai',
  aiMetadata: {
    description: 'Emails an Invoice Ninja quote to the client contacts that receive email and marks a draft as sent. Not idempotent: each call sends another email.',
    idempotent: false,
  },
  outputSchema: invoiceNinjaOutputSchemas.quote,
  props: { id: entityActions.bulkIdProp('Quote') },
  async run({ auth, propsValue }) {
    return entityActions.runBulk({ auth: auth.props, entity: 'quotes', label: 'Quote', action: 'email', id: propsValue.id });
  },
});

export const approveQuote = createAction({
  auth: invoiceninjaAuth,
  name: 'approve_quote',
  classification: 'WRITE',
  displayName: 'Approve Quote',
  description: 'Mark a sent quote as approved on the client\'s behalf.',
  audience: 'ai',
  aiMetadata: {
    description: 'Approves an Invoice Ninja quote (status 3) on the client\'s behalf, including a draft quote. Idempotent.',
    idempotent: true,
  },
  outputSchema: invoiceNinjaOutputSchemas.quote,
  props: { id: entityActions.bulkIdProp('Quote') },
  async run({ auth, propsValue }) {
    return entityActions.runBulk({ auth: auth.props, entity: 'quotes', label: 'Quote', action: 'approve', id: propsValue.id });
  },
});

export const convertQuoteToInvoice = createAction({
  auth: invoiceninjaAuth,
  name: 'convert_quote_to_invoice',
  classification: 'WRITE',
  displayName: 'Convert Quote to Invoice',
  description: 'Create an invoice from a quote.',
  audience: 'ai',
  aiMetadata: {
    description: 'Converts an Invoice Ninja quote into a new draft invoice; the returned quote has status 4 and invoice_id set to the new invoice (fetch it with Get Invoice). Calling it again on a converted quote fails and creates nothing.',
    idempotent: false,
  },
  outputSchema: invoiceNinjaOutputSchemas.quote,
  props: { id: entityActions.bulkIdProp('Quote') },
  async run({ auth, propsValue }) {
    return entityActions.runBulk({ auth: auth.props, entity: 'quotes', label: 'Quote', action: 'convert_to_invoice', id: propsValue.id });
  },
});

export const deleteQuote = createAction({
  auth: invoiceninjaAuth,
  name: 'delete_quote',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Quote',
  description: 'Delete a quote (soft delete).',
  audience: 'ai',
  aiMetadata: {
    description: 'Deletes an Invoice Ninja quote by ID (soft delete, is_deleted true). Ask the user before calling. Deleting an already deleted quote fails.',
    idempotent: false,
  },
  outputSchema: invoiceNinjaOutputSchemas.quote,
  props: { id: entityActions.bulkIdProp('Quote') },
  async run({ auth, propsValue }) {
    return entityActions.runBulk({ auth: auth.props, entity: 'quotes', label: 'Quote', action: 'delete', id: propsValue.id });
  },
});
