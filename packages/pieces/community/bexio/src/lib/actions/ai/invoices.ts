import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { bexioAuth } from '../../auth';
import { bexioAi, BexioPdf } from '../../common/ai-helpers';
import { bexioOutputSchemas } from '../../common/output-schemas';

export const bexioListInvoices = createAction({
  auth: bexioAuth,
  name: 'bexio_list_invoices',
  classification: 'SEARCH',
  displayName: 'List Invoices',
  description: 'List sales invoices in Bexio.',
  audience: 'ai',
  aiMetadata: { description: 'Lists sales invoices in Bexio; pass order_by=id_desc for newest first. Returns one page plus has_more and next_offset; call again with next_offset to continue. Read-only.', idempotent: true },
  outputSchema: bexioOutputSchemas.invoiceListOutputSchema,
  props: {
    ...bexioAi.listProps({ orderByHint: 'Sort field with optional _asc/_desc suffix, e.g. id_desc or updated_at_desc.' }),
  },
  async run({ auth, propsValue }) {
    return bexioAi.list({ auth, path: `/2.0/kb_invoice`, limit: propsValue.limit, offset: propsValue.offset, orderBy: propsValue.order_by });
  },
});

export const bexioSearchInvoices = createAction({
  auth: bexioAuth,
  name: 'bexio_search_invoices',
  classification: 'SEARCH',
  displayName: 'Search Invoices',
  description: 'Search sales invoices in Bexio by field criteria.',
  audience: 'ai',
  aiMetadata: { description: 'Finds sales invoices matching one or two field criteria (operators like, =, >, in, is_null, ...). kb_item_status_id: 7 draft, 8 pending, 9 paid, 16 partial, 19 cancelled. Use this to resolve an ID by name or number. Read-only.', idempotent: true },
  outputSchema: bexioOutputSchemas.invoiceListOutputSchema,
  props: {
    ...bexioAi.searchProps({ fieldsHint: 'id, kb_item_status_id, document_nr, title, contact_id, contact_sub_id, user_id, currency_id, total_gross, total_net, total, is_valid_from, is_valid_to, updated_at' }),
    ...bexioAi.listProps({ orderByHint: 'Sort field with optional _asc/_desc suffix, e.g. id_desc or updated_at_desc.' }),
  },
  async run({ auth, propsValue }) {
    return bexioAi.search({ auth, path: `/2.0/kb_invoice/search`, criteria: bexioAi.searchCriteria({ values: propsValue }), limit: propsValue.limit, offset: propsValue.offset, orderBy: propsValue.order_by });
  },
});

export const bexioGetInvoice = createAction({
  auth: bexioAuth,
  name: 'bexio_get_invoice',
  classification: 'READ',
  displayName: 'Get Invoice',
  description: 'Get a single sales invoice by ID.',
  audience: 'ai',
  aiMetadata: { description: 'Fetches one sales invoice by its numeric ID with all fields. Includes positions and totals. Read-only.', idempotent: true },
  outputSchema: bexioOutputSchemas.invoiceOutputSchema,
  props: {
    invoice_id: bexioAi.idProp({ displayName: 'Invoice ID', description: 'Numeric invoice ID. Find it with bexio_search_invoices or bexio_list_invoices.', required: true }),
  },
  async run({ auth, propsValue }) {
    return bexioAi.request({ auth, method: HttpMethod.GET, path: `/2.0/kb_invoice/${bexioAi.pathId({ value: propsValue.invoice_id, label: 'Invoice ID' })}` });
  },
});

export const bexioCreateInvoice = createAction({
  auth: bexioAuth,
  name: 'bexio_create_invoice',
  classification: 'WRITE',
  displayName: 'Create Invoice',
  description: 'Create a draft invoice.',
  audience: 'ai',
  aiMetadata: { description: 'Creates a draft sales invoice for a customer, with optional positions given as a JSON array. Issue it with bexio_issue_invoice, then email it with bexio_send_invoice. Each call creates a new invoice.', idempotent: false },
  outputSchema: bexioOutputSchemas.invoiceOutputSchema,
  props: {
    document_nr: Property.ShortText({ displayName: 'Document Number', description: 'Can not be used if “automatic numbering” is activated in frontend-settings. Required if “automatic numbering” deactivated. https://help.bexio.com/s/article/000001784', required: false }),
    title: Property.ShortText({ displayName: 'Title', description: 'Document title shown on the PDF.', required: false }),
    contact_id: Property.ShortText({ displayName: 'Contact ID', description: 'Customer contact ID from bexio_search_contacts.', required: true }),
    contact_sub_id: Property.ShortText({ displayName: 'Contact Sub ID', description: 'Optional contact person ID at the customer.', required: false }),
    user_id: Property.ShortText({ displayName: 'User ID', description: 'Responsible Bexio user ID from bexio_get_current_user.', required: true }),
    pr_project_id: Property.ShortText({ displayName: 'Pr Project ID', description: 'Project ID from bexio_search_projects.', required: false }),
    logopaper_id: Property.ShortText({ displayName: 'Logopaper ID', description: 'Numeric Bexio Logopaper ID.', required: false }),
    language_id: Property.ShortText({ displayName: 'Language ID', description: 'Language ID from bexio_list_languages.', required: false }),
    bank_account_id: Property.ShortText({ displayName: 'Bank Account ID', description: 'References a bank account object', required: false }),
    currency_id: Property.ShortText({ displayName: 'Currency ID', description: 'Currency ID from bexio_list_currencies.', required: false }),
    payment_type_id: Property.ShortText({ displayName: 'Payment Type ID', description: 'Payment type ID from bexio_list_payment_types.', required: false }),
    header: Property.LongText({ displayName: 'Header', description: 'Text printed above the positions.', required: false }),
    footer: Property.LongText({ displayName: 'Footer', description: 'Text printed below the positions.', required: false }),
    mwst_is_net: bexioAi.flagProp({ displayName: 'Mwst Is Net', description: 'This value affects the total if the field mwst_type has been set to 0.<br> false = Taxes are included in the total<br> true = Taxes will be added to the total' }),
    show_position_taxes: bexioAi.flagProp({ displayName: 'Show Position Taxes', description: 'Show Position Taxes.' }),
    is_valid_from: Property.ShortText({ displayName: 'Is Valid From', description: 'Document date. Format YYYY-MM-DD. Format YYYY-MM-DD.', required: false }),
    is_valid_to: Property.ShortText({ displayName: 'Is Valid To', description: 'Format YYYY-MM-DD.', required: false }),
    contact_address_manual: Property.LongText({ displayName: 'Contact Address Manual', description: 'This field can be used to set a contact address manually. If not in use or null the invoice address of the contact will be taken.', required: false }),
    reference: Property.ShortText({ displayName: 'Reference', description: 'Customer reference shown on the document.', required: false }),
    api_reference: Property.ShortText({ displayName: 'Api Reference', description: 'This field can only be read and edited by the api. It can be used to save references to other systems.', required: false }),
    template_slug: Property.ShortText({ displayName: 'Template Slug', description: 'References a document template slug', required: false }),
    mwst_type: Property.StaticDropdown<string>({ displayName: 'VAT Mode', description: 'How position prices treat VAT: 0 = prices include VAT, 1 = VAT is added on top of the prices, 2 = VAT exempt (no VAT). Bexio defaults to 2 (exempt) when omitted, so set this for taxable documents.', required: false, options: { disabled: false, options: [{ label: 'Prices include VAT (0)', value: '0' }, { label: 'VAT added on top (1)', value: '1' }, { label: 'VAT exempt (2)', value: '2' }] } }),
    positions: Property.Json({ displayName: 'Positions', description: 'Optional JSON array of positions. Example custom line: [{"type":"KbPositionCustom","amount":"1","unit_price":"100.00","tax_id":3,"text":"Consulting"}]. Article line: {"type":"KbPositionArticle","article_id":1,"amount":"2"}. Tax IDs come from bexio_list_taxes (types=sales_tax, scope=active).', required: false }),
  },
  async run({ auth, propsValue }) {
    const body = bexioAi.buildBody({ values: propsValue, fields: { document_nr: 'text', title: 'text', contact_id: 'id', contact_sub_id: 'id', user_id: 'id', pr_project_id: 'id', logopaper_id: 'id', language_id: 'id', bank_account_id: 'id', currency_id: 'id', payment_type_id: 'id', header: 'text', footer: 'text', mwst_is_net: 'flag', show_position_taxes: 'flag', is_valid_from: 'text', is_valid_to: 'text', contact_address_manual: 'text', reference: 'text', api_reference: 'text', template_slug: 'text', mwst_type: 'number' } });
    const positions = propsValue.positions === undefined || propsValue.positions === null ? undefined : bexioAi.requireArray({ value: propsValue.positions, key: 'positions' });
    return bexioAi.request({ auth, method: HttpMethod.POST, path: '/2.0/kb_invoice', body: positions ? { ...body, positions } : body });
  },
});

export const bexioIssueInvoice = createAction({
  auth: bexioAuth,
  name: 'bexio_issue_invoice',
  classification: 'WRITE',
  displayName: 'Issue Invoice',
  description: 'Issue a draft invoice.',
  audience: 'ai',
  aiMetadata: { description: 'Issues a draft invoice so it becomes pending and can be sent or paid. bexio_revert_invoice_to_draft undoes it. Fails if the invoice is not a draft.', idempotent: false },
  outputSchema: bexioOutputSchemas.successOutputSchema,
  props: {
    invoice_id: bexioAi.idProp({ displayName: 'Invoice ID', description: 'Numeric invoice ID. Find it with bexio_search_invoices or bexio_list_invoices.', required: true }),
  },
  async run({ auth, propsValue }) {
    return bexioAi.request({ auth, method: HttpMethod.POST, path: `/2.0/kb_invoice/${bexioAi.pathId({ value: propsValue.invoice_id, label: 'Invoice ID' })}/issue` });
  },
});

export const bexioRevertInvoiceToDraft = createAction({
  auth: bexioAuth,
  name: 'bexio_revert_invoice_to_draft',
  classification: 'WRITE',
  displayName: 'Revert Invoice to Draft',
  description: 'Revert an issued invoice to draft.',
  audience: 'ai',
  aiMetadata: { description: 'Reverts an issued invoice without payments back to draft so it can be edited.', idempotent: false },
  outputSchema: bexioOutputSchemas.successOutputSchema,
  props: {
    invoice_id: bexioAi.idProp({ displayName: 'Invoice ID', description: 'Numeric invoice ID. Find it with bexio_search_invoices or bexio_list_invoices.', required: true }),
  },
  async run({ auth, propsValue }) {
    return bexioAi.request({ auth, method: HttpMethod.POST, path: `/2.0/kb_invoice/${bexioAi.pathId({ value: propsValue.invoice_id, label: 'Invoice ID' })}/revert_issue` });
  },
});

export const bexioMarkInvoiceSent = createAction({
  auth: bexioAuth,
  name: 'bexio_mark_invoice_sent',
  classification: 'WRITE',
  displayName: 'Mark Invoice as Sent',
  description: 'Mark an invoice as sent.',
  audience: 'ai',
  aiMetadata: { description: 'Marks an issued invoice as sent without emailing it, e.g. after it was delivered by post.', idempotent: false },
  outputSchema: bexioOutputSchemas.successOutputSchema,
  props: {
    invoice_id: bexioAi.idProp({ displayName: 'Invoice ID', description: 'Numeric invoice ID. Find it with bexio_search_invoices or bexio_list_invoices.', required: true }),
  },
  async run({ auth, propsValue }) {
    return bexioAi.request({ auth, method: HttpMethod.POST, path: `/2.0/kb_invoice/${bexioAi.pathId({ value: propsValue.invoice_id, label: 'Invoice ID' })}/mark_as_sent` });
  },
});

export const bexioSendInvoice = createAction({
  auth: bexioAuth,
  name: 'bexio_send_invoice',
  classification: 'WRITE',
  displayName: 'Send Invoice',
  description: 'Email the invoice.',
  audience: 'ai',
  aiMetadata: { description: 'Emails the invoice to a recipient through Bexio. The message must contain the placeholder [Network Link]. Each call sends another email, so do not retry blindly.', idempotent: false },
  outputSchema: bexioOutputSchemas.successOutputSchema,
  props: {
    invoice_id: bexioAi.idProp({ displayName: 'Invoice ID', description: 'Numeric invoice ID. Find it with bexio_search_invoices or bexio_list_invoices.', required: true }),
    recipient_email: Property.ShortText({ displayName: 'Recipient Email', description: 'Recipient email address.', required: true }),
    subject: Property.ShortText({ displayName: 'Subject', description: 'Email subject line.', required: true }),
    message: Property.LongText({ displayName: 'Message', description: 'Email body. Must contain the placeholder [Network Link].', required: true }),
    mark_as_open: bexioAi.flagProp({ displayName: 'Mark As Open', description: 'Set to yes to mark the document as open (issued) when sending.' }),
    attach_pdf: bexioAi.flagProp({ displayName: 'Attach PDF', description: 'Set to yes to attach the PDF.' }),
  },
  async run({ auth, propsValue }) {
    bexioAi.requireNetworkLink({ message: propsValue.message });
    return bexioAi.request({ auth, method: HttpMethod.POST, path: `/2.0/kb_invoice/${bexioAi.pathId({ value: propsValue.invoice_id, label: 'Invoice ID' })}/send`, body: bexioAi.buildBody({ values: propsValue, fields: { recipient_email: 'text', subject: 'text', message: 'text', mark_as_open: 'flag', attach_pdf: 'flag' } }) });
  },
});

export const bexioCancelInvoice = createAction({
  auth: bexioAuth,
  name: 'bexio_cancel_invoice',
  classification: 'DESTRUCTIVE',
  displayName: 'Cancel Invoice',
  description: 'Cancel an invoice.',
  audience: 'ai',
  aiMetadata: { description: 'Cancels an issued invoice. The invoice stays on record as cancelled and cannot be reopened.', idempotent: false },
  outputSchema: bexioOutputSchemas.successOutputSchema,
  props: {
    invoice_id: bexioAi.idProp({ displayName: 'Invoice ID', description: 'Numeric invoice ID. Find it with bexio_search_invoices or bexio_list_invoices.', required: true }),
  },
  async run({ auth, propsValue }) {
    return bexioAi.request({ auth, method: HttpMethod.POST, path: `/2.0/kb_invoice/${bexioAi.pathId({ value: propsValue.invoice_id, label: 'Invoice ID' })}/cancel` });
  },
});

export const bexioDeleteInvoice = createAction({
  auth: bexioAuth,
  name: 'bexio_delete_invoice',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Invoice',
  description: 'Delete an invoice.',
  audience: 'ai',
  aiMetadata: { description: 'Permanently deletes an invoice (normally only drafts). A second call fails.', idempotent: false },
  outputSchema: bexioOutputSchemas.successOutputSchema,
  props: {
    invoice_id: bexioAi.idProp({ displayName: 'Invoice ID', description: 'Numeric invoice ID. Find it with bexio_search_invoices or bexio_list_invoices.', required: true }),
  },
  async run({ auth, propsValue }) {
    return bexioAi.request({ auth, method: HttpMethod.DELETE, path: `/2.0/kb_invoice/${bexioAi.pathId({ value: propsValue.invoice_id, label: 'Invoice ID' })}` });
  },
});

export const bexioCopyInvoice = createAction({
  auth: bexioAuth,
  name: 'bexio_copy_invoice',
  classification: 'WRITE',
  displayName: 'Copy Invoice',
  description: 'Copy an invoice.',
  audience: 'ai',
  aiMetadata: { description: 'Creates a new draft invoice copied from an existing one, for the given customer. Each call creates another copy.', idempotent: false },
  outputSchema: bexioOutputSchemas.invoiceOutputSchema,
  props: {
    invoice_id: bexioAi.idProp({ displayName: 'Invoice ID', description: 'Numeric invoice ID. Find it with bexio_search_invoices or bexio_list_invoices.', required: true }),
    contact_id: Property.ShortText({ displayName: 'Contact ID', description: 'Customer contact ID from bexio_search_contacts.', required: true }),
    contact_sub_id: Property.ShortText({ displayName: 'Contact Sub ID', description: 'Optional contact person ID at the customer.', required: false }),
    is_valid_from: Property.ShortText({ displayName: 'Is Valid From', description: 'Document date. Format YYYY-MM-DD. Format YYYY-MM-DD.', required: false }),
    title: Property.ShortText({ displayName: 'Title', description: 'Document title shown on the PDF.', required: false }),
  },
  async run({ auth, propsValue }) {
    return bexioAi.request({ auth, method: HttpMethod.POST, path: `/2.0/kb_invoice/${bexioAi.pathId({ value: propsValue.invoice_id, label: 'Invoice ID' })}/copy`, body: bexioAi.buildBody({ values: propsValue, fields: { contact_id: 'id', contact_sub_id: 'id', is_valid_from: 'text', title: 'text' } }) });
  },
});

export const bexioGetInvoicePdf = createAction({
  auth: bexioAuth,
  name: 'bexio_get_invoice_pdf',
  classification: 'READ',
  displayName: 'Get Invoice PDF',
  description: 'Download an invoice as a PDF file.',
  audience: 'ai',
  aiMetadata: { description: 'Renders the invoice as a PDF and returns it as a file. Use bexio_send_invoice instead to email it. Read-only.', idempotent: true },
  outputSchema: bexioOutputSchemas.pdfOutputSchema,
  props: {
    invoice_id: bexioAi.idProp({ displayName: 'Invoice ID', description: 'Numeric invoice ID. Find it with bexio_search_invoices or bexio_list_invoices.', required: true }),
  },
  async run({ auth, propsValue, files }) {
    const pdf = await bexioAi.request<BexioPdf>({ auth, method: HttpMethod.GET, path: `/2.0/kb_invoice/${bexioAi.pathId({ value: propsValue.invoice_id, label: 'Invoice ID' })}/pdf` });
    return bexioAi.writePdf({ files, pdf, fallbackName: `invoice-${propsValue.invoice_id}.pdf` });
  },
});

export const bexioListInvoicePayments = createAction({
  auth: bexioAuth,
  name: 'bexio_list_invoice_payments',
  classification: 'SEARCH',
  displayName: 'List Invoice Payments',
  description: 'List payments recorded on an invoice in Bexio.',
  audience: 'ai',
  aiMetadata: { description: 'Lists payments recorded on an invoice in Bexio. Returns one page plus has_more and next_offset; call again with next_offset to continue. Read-only.', idempotent: true },
  outputSchema: bexioOutputSchemas.paymentListOutputSchema,
  props: {
    invoice_id: bexioAi.idProp({ displayName: 'Invoice ID', description: 'Numeric invoice ID. Find it with bexio_search_invoices or bexio_list_invoices.', required: true }),
    ...bexioAi.listProps({}),
  },
  async run({ auth, propsValue }) {
    return bexioAi.list({ auth, path: `/2.0/kb_invoice/${bexioAi.pathId({ value: propsValue.invoice_id, label: 'Invoice ID' })}/payment`, limit: propsValue.limit, offset: propsValue.offset });
  },
});

export const bexioCreateInvoicePayment = createAction({
  auth: bexioAuth,
  name: 'bexio_create_invoice_payment',
  classification: 'WRITE',
  displayName: 'Record Invoice Payment',
  description: 'Record a payment received for an invoice.',
  audience: 'ai',
  aiMetadata: { description: 'Records a received payment against an issued invoice. This books the payment in Bexio; it does not move money. Each call records another payment, so check bexio_list_invoice_payments before retrying.', idempotent: false },
  outputSchema: bexioOutputSchemas.paymentOutputSchema,
  props: {
    invoice_id: bexioAi.idProp({ displayName: 'Invoice ID', description: 'Numeric invoice ID. Find it with bexio_search_invoices or bexio_list_invoices.', required: true }),
    date: Property.ShortText({ displayName: 'Date', description: 'Payment date. Format YYYY-MM-DD. Format YYYY-MM-DD.', required: true }),
    value: Property.ShortText({ displayName: 'Value', description: 'Amount received as a decimal string, e.g. 100.00.', required: true }),
    bank_account_id: Property.ShortText({ displayName: 'Bank Account ID', description: 'Bank account ID the payment was received on. Leave empty to use the default.', required: false }),
  },
  async run({ auth, propsValue }) {
    return bexioAi.request({ auth, method: HttpMethod.POST, path: `/2.0/kb_invoice/${bexioAi.pathId({ value: propsValue.invoice_id, label: 'Invoice ID' })}/payment`, body: bexioAi.buildBody({ values: propsValue, fields: { date: 'text', value: 'decimal', bank_account_id: 'id' } }) });
  },
});

export const bexioDeleteInvoicePayment = createAction({
  auth: bexioAuth,
  name: 'bexio_delete_invoice_payment',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Invoice Payment',
  description: 'Delete a payment from an invoice.',
  audience: 'ai',
  aiMetadata: { description: 'Deletes a payment recorded on an invoice, reopening the amount. A second call fails.', idempotent: false },
  outputSchema: bexioOutputSchemas.successOutputSchema,
  props: {
    invoice_id: bexioAi.idProp({ displayName: 'Invoice ID', description: 'Numeric invoice ID. Find it with bexio_search_invoices or bexio_list_invoices.', required: true }),
    payment_id: bexioAi.idProp({ displayName: 'Payment ID', description: 'Numeric payment ID. Find it with bexio_list_invoice_payments.', required: true }),
  },
  async run({ auth, propsValue }) {
    return bexioAi.request({ auth, method: HttpMethod.DELETE, path: `/2.0/kb_invoice/${bexioAi.pathId({ value: propsValue.invoice_id, label: 'Invoice ID' })}/payment/${bexioAi.pathId({ value: propsValue.payment_id, label: 'Payment ID' })}` });
  },
});

export const bexioListInvoiceReminders = createAction({
  auth: bexioAuth,
  name: 'bexio_list_invoice_reminders',
  classification: 'SEARCH',
  displayName: 'List Invoice Reminders',
  description: 'List payment reminders of an invoice in Bexio.',
  audience: 'ai',
  aiMetadata: { description: 'Lists all payment reminders of an invoice in one call (no paging). Read-only.', idempotent: true },
  outputSchema: bexioOutputSchemas.reminderAllOutputSchema,
  props: {
    invoice_id: bexioAi.idProp({ displayName: 'Invoice ID', description: 'Numeric invoice ID. Find it with bexio_search_invoices or bexio_list_invoices.', required: true }),
  },
  async run({ auth, propsValue }) {
    const items = await bexioAi.request<unknown[]>({ auth, method: HttpMethod.GET, path: `/2.0/kb_invoice/${bexioAi.pathId({ value: propsValue.invoice_id, label: 'Invoice ID' })}/kb_reminder` });
    const all = Array.isArray(items) ? items : [];
    return { items: all, count: all.length };
  },
});

export const bexioCreateInvoiceReminder = createAction({
  auth: bexioAuth,
  name: 'bexio_create_invoice_reminder',
  classification: 'WRITE',
  displayName: 'Create Invoice Reminder',
  description: 'Create a payment reminder for an invoice.',
  audience: 'ai',
  aiMetadata: { description: 'Creates the next payment reminder level for an overdue invoice. Each call creates another reminder. Send it with bexio_send_invoice_reminder.', idempotent: false },
  outputSchema: bexioOutputSchemas.reminderOutputSchema,
  props: {
    invoice_id: bexioAi.idProp({ displayName: 'Invoice ID', description: 'Numeric invoice ID. Find it with bexio_search_invoices or bexio_list_invoices.', required: true }),
  },
  async run({ auth, propsValue }) {
    return bexioAi.request({ auth, method: HttpMethod.POST, path: `/2.0/kb_invoice/${bexioAi.pathId({ value: propsValue.invoice_id, label: 'Invoice ID' })}/kb_reminder` });
  },
});

export const bexioSendInvoiceReminder = createAction({
  auth: bexioAuth,
  name: 'bexio_send_invoice_reminder',
  classification: 'WRITE',
  displayName: 'Send Invoice Reminder',
  description: 'Email the payment reminder.',
  audience: 'ai',
  aiMetadata: { description: 'Emails the payment reminder to a recipient through Bexio. The message must contain the placeholder [Network Link]. Each call sends another email, so do not retry blindly.', idempotent: false },
  outputSchema: bexioOutputSchemas.successOutputSchema,
  props: {
    invoice_id: bexioAi.idProp({ displayName: 'Invoice ID', description: 'Numeric invoice ID. Find it with bexio_search_invoices or bexio_list_invoices.', required: true }),
    reminder_id: bexioAi.idProp({ displayName: 'Reminder ID', description: 'Numeric reminder ID. Find it with bexio_list_invoice_reminders.', required: true }),
    recipient_email: Property.ShortText({ displayName: 'Recipient Email', description: 'Recipient email address.', required: true }),
    subject: Property.ShortText({ displayName: 'Subject', description: 'Email subject line.', required: true }),
    message: Property.LongText({ displayName: 'Message', description: 'Email body. Must contain the placeholder [Network Link].', required: true }),
  },
  async run({ auth, propsValue }) {
    bexioAi.requireNetworkLink({ message: propsValue.message });
    return bexioAi.request({ auth, method: HttpMethod.POST, path: `/2.0/kb_invoice/${bexioAi.pathId({ value: propsValue.invoice_id, label: 'Invoice ID' })}/kb_reminder/${bexioAi.pathId({ value: propsValue.reminder_id, label: 'Reminder ID' })}/send`, body: bexioAi.buildBody({ values: propsValue, fields: { recipient_email: 'text', subject: 'text', message: 'text' } }) });
  },
});
