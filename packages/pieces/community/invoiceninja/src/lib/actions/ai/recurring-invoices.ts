import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { invoiceninjaAuth } from '../../common/auth';
import { invoiceNinjaClient } from '../../common/client';
import { entityActions } from '../../common/entity-actions';
import { invoiceNinjaOutputSchemas } from '../../common/output-schemas';
import { invoiceNinjaProps } from '../../common/props';

export const getRecurringInvoice = createAction({
  auth: invoiceninjaAuth,
  name: 'get_recurring_invoice',
  classification: 'READ',
  displayName: 'Get Recurring Invoice',
  description: 'Get one recurring invoice by its ID.',
  audience: 'ai',
  aiMetadata: {
    description: 'Returns one Invoice Ninja recurring invoice by ID: status, frequency, next send date, remaining cycles and line items. Read-only.',
    idempotent: true,
  },
  outputSchema: invoiceNinjaOutputSchemas.recurring,
  props: { id: entityActions.getIdProp('Recurring Invoice') },
  async run({ auth, propsValue }) {
    return entityActions.runGet({ auth: auth.props, entity: 'recurring_invoices', label: 'Recurring Invoice', id: propsValue.id });
  },
});

export const listRecurringInvoices = createAction({
  auth: invoiceninjaAuth,
  name: 'list_recurring_invoices',
  classification: 'SEARCH',
  displayName: 'List Recurring Invoices',
  description: 'List recurring invoices, one page at a time.',
  audience: 'ai',
  aiMetadata: {
    description: 'Lists Invoice Ninja recurring invoices, optionally for one client or by schedule state (active, paused, completed). Returns {items, page, perPage, total, hasMore}. Read-only.',
    idempotent: true,
  },
  outputSchema: invoiceNinjaOutputSchemas.recurringList,
  props: {
    client_id: Property.ShortText({ displayName: 'Client ID', required: false }),
    schedule_state: Property.StaticDropdown<string>({
      displayName: 'Schedule State',
      required: false,
      options: {
        options: [
          { label: 'All', value: 'all' },
          { label: 'Active', value: 'active' },
          { label: 'Paused', value: 'paused' },
          { label: 'Completed', value: 'completed' },
        ],
      },
    }),
    search: Property.ShortText({ displayName: 'Search', required: false }),
    status: entityActions.statusProp(),
    ...entityActions.listProps(),
  },
  async run({ auth, propsValue }) {
    return entityActions.runList({
      auth: auth.props,
      entity: 'recurring_invoices',
      page: propsValue.page,
      perPage: propsValue.per_page,
      query: {
        client_id: invoiceNinjaClient.optionalId({ value: propsValue.client_id, label: 'Client ID' }),
        client_status: propsValue.schedule_state,
        filter: invoiceNinjaClient.optionalText(propsValue.search),
        status: propsValue.status,
      },
    });
  },
});

export const createRecurringInvoiceAi = createAction({
  auth: invoiceninjaAuth,
  name: 'create_recurring_invoice_ai',
  classification: 'WRITE',
  displayName: 'Create Recurring Invoice (from line items)',
  description: 'Create a draft recurring invoice from line items and a schedule.',
  audience: 'ai',
  aiMetadata: {
    description: 'Creates a draft Invoice Ninja recurring invoice for client_id from line_items, billing every frequency_id (1 daily, 2 weekly, 3 two weeks, 4 four weeks, 5 monthly, 6 two months, 7 quarterly, 8 four months, 9 six months, 10 annually, 11 two years, 12 three years) starting next_send_date (YYYY-MM-DD) for remaining_cycles (-1 or empty = endless). It stays a draft until Start Recurring Invoice. Not idempotent.',
    idempotent: false,
  },
  outputSchema: invoiceNinjaOutputSchemas.recurring,
  props: {
    client_id: Property.ShortText({ displayName: 'Client ID', required: true }),
    line_items: invoiceNinjaProps.lineItems({ required: true }),
    frequency_id: Property.Number({ displayName: 'Frequency ID', description: '1-12, see the description. 5 = monthly.', required: true }),
    next_send_date: Property.ShortText({ displayName: 'Next Send Date', description: 'YYYY-MM-DD, today or later.', required: true }),
    remaining_cycles: Property.Number({ displayName: 'Remaining Cycles', description: 'How many invoices to generate; -1 or empty = endless.', required: false }),
    ...invoiceNinjaProps.recurringDocumentProps(),
  },
  async run({ auth, propsValue }) {
    const frequency = invoiceNinjaClient.optionalInt({ value: propsValue.frequency_id, label: 'Frequency ID', min: 1, max: 12 });
    const cycles = invoiceNinjaClient.optionalInt({ value: propsValue.remaining_cycles, label: 'Remaining Cycles', min: -1, max: 9999 });
    const body = invoiceNinjaClient.compact({
      ...invoiceNinjaProps.documentBody(propsValue),
      client_id: invoiceNinjaClient.parseId({ value: propsValue.client_id, label: 'Client ID' }),
      line_items: invoiceNinjaClient.lineItemsOf({ value: propsValue.line_items, label: 'Line Items', required: true, isAmountDiscount: invoiceNinjaClient.parseBoolean(propsValue.is_amount_discount) }),
      frequency_id: frequency === undefined ? undefined : String(frequency),
      next_send_date: invoiceNinjaClient.toDateOnly({ value: propsValue.next_send_date, label: 'Next Send Date' }),
      remaining_cycles: cycles ?? -1,
    });
    return invoiceNinjaClient.recordOf(
      await invoiceNinjaClient.request({ auth: auth.props, method: HttpMethod.POST, path: '/recurring_invoices', body }),
    );
  },
});

export const startRecurringInvoice = createAction({
  auth: invoiceninjaAuth,
  name: 'start_recurring_invoice',
  classification: 'WRITE',
  displayName: 'Start Recurring Invoice',
  description: 'Start (or resume) the schedule of a recurring invoice.',
  audience: 'ai',
  aiMetadata: {
    description: 'Starts or resumes an Invoice Ninja recurring invoice so it generates invoices on its schedule (status 2 active). Idempotent.',
    idempotent: true,
  },
  outputSchema: invoiceNinjaOutputSchemas.recurring,
  props: { id: entityActions.bulkIdProp('Recurring Invoice') },
  async run({ auth, propsValue }) {
    return entityActions.runBulk({ auth: auth.props, entity: 'recurring_invoices', label: 'Recurring Invoice', action: 'start', id: propsValue.id });
  },
});

export const stopRecurringInvoice = createAction({
  auth: invoiceninjaAuth,
  name: 'stop_recurring_invoice',
  classification: 'DESTRUCTIVE',
  displayName: 'Pause Recurring Invoice',
  description: 'Pause the schedule of a recurring invoice.',
  audience: 'ai',
  aiMetadata: {
    description: 'Pauses an Invoice Ninja recurring invoice (status 3 paused); no invoices are generated until Start Recurring Invoice. Idempotent.',
    idempotent: true,
  },
  outputSchema: invoiceNinjaOutputSchemas.recurring,
  props: { id: entityActions.bulkIdProp('Recurring Invoice') },
  async run({ auth, propsValue }) {
    return entityActions.runBulk({ auth: auth.props, entity: 'recurring_invoices', label: 'Recurring Invoice', action: 'stop', id: propsValue.id });
  },
});

export const sendRecurringInvoiceNow = createAction({
  auth: invoiceninjaAuth,
  name: 'send_recurring_invoice_now',
  classification: 'WRITE',
  displayName: 'Send Recurring Invoice Now',
  description: 'Generate and send the next invoice of a recurring invoice now.',
  audience: 'ai',
  aiMetadata: {
    description: 'Generates the next invoice from an Invoice Ninja recurring invoice immediately (and emails it if the schedule sends emails), then moves next_send_date forward. Not idempotent: each call creates another invoice.',
    idempotent: false,
  },
  outputSchema: invoiceNinjaOutputSchemas.recurring,
  props: { id: entityActions.bulkIdProp('Recurring Invoice') },
  async run({ auth, propsValue }) {
    return entityActions.runBulk({ auth: auth.props, entity: 'recurring_invoices', label: 'Recurring Invoice', action: 'send_now', id: propsValue.id });
  },
});

export const deleteRecurringInvoice = createAction({
  auth: invoiceninjaAuth,
  name: 'delete_recurring_invoice',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Recurring Invoice',
  description: 'Delete a recurring invoice (soft delete; invoices already generated stay).',
  audience: 'ai',
  aiMetadata: {
    description: 'Deletes an Invoice Ninja recurring invoice by ID (soft delete) so it stops generating invoices; invoices it already created are kept. Ask the user before calling.',
    idempotent: false,
  },
  outputSchema: invoiceNinjaOutputSchemas.recurring,
  props: { id: entityActions.bulkIdProp('Recurring Invoice') },
  async run({ auth, propsValue }) {
    return entityActions.runBulk({ auth: auth.props, entity: 'recurring_invoices', label: 'Recurring Invoice', action: 'delete', id: propsValue.id });
  },
});
