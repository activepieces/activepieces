import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { bexioAuth } from '../../auth';
import { bexioAi, BexioPdf } from '../../common/ai-helpers';
import { bexioOutputSchemas } from '../../common/output-schemas';

export const bexioListQuotes = createAction({
  auth: bexioAuth,
  name: 'bexio_list_quotes',
  classification: 'SEARCH',
  displayName: 'List Quotes',
  description: 'List quotes (offers) in Bexio.',
  audience: 'ai',
  aiMetadata: { description: 'Lists quotes (offers) in Bexio; pass order_by=id_desc for newest first. Returns one page plus has_more and next_offset; call again with next_offset to continue. Read-only.', idempotent: true },
  outputSchema: bexioOutputSchemas.quoteListOutputSchema,
  props: {
    ...bexioAi.listProps({ orderByHint: 'Sort field with optional _asc/_desc suffix, e.g. id_desc or updated_at_desc.' }),
  },
  async run({ auth, propsValue }) {
    return bexioAi.list({ auth, path: `/2.0/kb_offer`, limit: propsValue.limit, offset: propsValue.offset, orderBy: propsValue.order_by });
  },
});

export const bexioSearchQuotes = createAction({
  auth: bexioAuth,
  name: 'bexio_search_quotes',
  classification: 'SEARCH',
  displayName: 'Search Quotes',
  description: 'Search quotes (offers) in Bexio by field criteria.',
  audience: 'ai',
  aiMetadata: { description: 'Finds quotes (offers) matching one or two field criteria (operators like, =, >, in, is_null, ...). Use this to resolve an ID by name or number. Read-only.', idempotent: true },
  outputSchema: bexioOutputSchemas.quoteListOutputSchema,
  props: {
    ...bexioAi.searchProps({ fieldsHint: 'id, kb_item_status_id, document_nr, title, contact_id, contact_sub_id, user_id, currency_id, total_gross, total_net, total, is_valid_from, is_valid_to, is_valid_until, updated_at' }),
    ...bexioAi.listProps({ orderByHint: 'Sort field with optional _asc/_desc suffix, e.g. id_desc or updated_at_desc.' }),
  },
  async run({ auth, propsValue }) {
    return bexioAi.search({ auth, path: `/2.0/kb_offer/search`, criteria: bexioAi.searchCriteria({ values: propsValue }), limit: propsValue.limit, offset: propsValue.offset, orderBy: propsValue.order_by });
  },
});

export const bexioGetQuote = createAction({
  auth: bexioAuth,
  name: 'bexio_get_quote',
  classification: 'READ',
  displayName: 'Get Quote',
  description: 'Get a single quote by ID.',
  audience: 'ai',
  aiMetadata: { description: 'Fetches one quote by its numeric ID with all fields. Includes positions and totals. Read-only.', idempotent: true },
  outputSchema: bexioOutputSchemas.quoteOutputSchema,
  props: {
    quote_id: bexioAi.idProp({ displayName: 'Quote ID', description: 'Numeric quote ID. Find it with bexio_search_quotes or bexio_list_quotes.', required: true }),
  },
  async run({ auth, propsValue }) {
    return bexioAi.request({ auth, method: HttpMethod.GET, path: `/2.0/kb_offer/${bexioAi.pathId({ value: propsValue.quote_id, label: 'Quote ID' })}` });
  },
});

export const bexioCreateQuote = createAction({
  auth: bexioAuth,
  name: 'bexio_create_quote',
  classification: 'WRITE',
  displayName: 'Create Quote',
  description: 'Create a draft quote.',
  audience: 'ai',
  aiMetadata: { description: 'Creates a draft quote (offer) for a customer, with optional positions given as a JSON array. Issue it with bexio_issue_quote and email it with bexio_send_quote. Each call creates a new quote.', idempotent: false },
  outputSchema: bexioOutputSchemas.quoteOutputSchema,
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
    is_valid_until: Property.ShortText({ displayName: 'Is Valid Until', description: 'Format YYYY-MM-DD.', required: false }),
    contact_address_manual: Property.LongText({ displayName: 'Contact Address Manual', description: 'This field can be used to set a contact address manually. If not in use or null the invoice address of the contact will be taken.', required: false }),
    delivery_address_type: Property.Number({ displayName: 'Delivery Address Type', description: '| value | description | |-------|-------------| | 0 | use invoice address | | 1 | use custom address |', required: false }),
    delivery_address_manual: Property.LongText({ displayName: 'Delivery Address Manual', description: 'This field can be used to set a delivery address manually if delivery_address_type is set to 1. If not in use or null the invoice address will be taken.', required: false }),
    api_reference: Property.ShortText({ displayName: 'Api Reference', description: 'This field can only be read and edited by the api. It can be used to save references to other systems.', required: false }),
    kb_terms_of_payment_template_id: Property.ShortText({ displayName: 'Kb Terms Of Payment Template ID', description: 'Numeric Bexio Kb Terms Of Payment Template ID.', required: false }),
    template_slug: Property.ShortText({ displayName: 'Template Slug', description: 'References a document template slug', required: false }),
    mwst_type: Property.StaticDropdown<string>({ displayName: 'VAT Mode', description: 'How position prices treat VAT: 0 = prices include VAT, 1 = VAT is added on top of the prices, 2 = VAT exempt (no VAT). Bexio defaults to 2 (exempt) when omitted, so set this for taxable documents.', required: false, options: { disabled: false, options: [{ label: 'Prices include VAT (0)', value: '0' }, { label: 'VAT added on top (1)', value: '1' }, { label: 'VAT exempt (2)', value: '2' }] } }),
    positions: Property.Json({ displayName: 'Positions', description: 'Optional JSON array of positions. Example custom line: [{"type":"KbPositionCustom","amount":"1","unit_price":"100.00","tax_id":3,"text":"Consulting"}]. Article line: {"type":"KbPositionArticle","article_id":1,"amount":"2"}. Tax IDs come from bexio_list_taxes (types=sales_tax, scope=active).', required: false }),
  },
  async run({ auth, propsValue }) {
    const body = bexioAi.buildBody({ values: propsValue, fields: { document_nr: 'text', title: 'text', contact_id: 'id', contact_sub_id: 'id', user_id: 'id', pr_project_id: 'id', logopaper_id: 'id', language_id: 'id', bank_account_id: 'id', currency_id: 'id', payment_type_id: 'id', header: 'text', footer: 'text', mwst_is_net: 'flag', show_position_taxes: 'flag', is_valid_from: 'text', is_valid_until: 'text', contact_address_manual: 'text', delivery_address_type: 'number', delivery_address_manual: 'text', api_reference: 'text', kb_terms_of_payment_template_id: 'id', template_slug: 'text', mwst_type: 'number' } });
    const positions = propsValue.positions === undefined || propsValue.positions === null ? undefined : bexioAi.requireArray({ value: propsValue.positions, key: 'positions' });
    return bexioAi.request({ auth, method: HttpMethod.POST, path: '/2.0/kb_offer', body: positions ? { ...body, positions } : body });
  },
});

export const bexioIssueQuote = createAction({
  auth: bexioAuth,
  name: 'bexio_issue_quote',
  classification: 'WRITE',
  displayName: 'Issue Quote',
  description: 'Issue a draft quote.',
  audience: 'ai',
  aiMetadata: { description: 'Issues a draft quote so it can be sent and accepted. Fails if the quote is not a draft.', idempotent: false },
  outputSchema: bexioOutputSchemas.successOutputSchema,
  props: {
    quote_id: bexioAi.idProp({ displayName: 'Quote ID', description: 'Numeric quote ID. Find it with bexio_search_quotes or bexio_list_quotes.', required: true }),
  },
  async run({ auth, propsValue }) {
    return bexioAi.request({ auth, method: HttpMethod.POST, path: `/2.0/kb_offer/${bexioAi.pathId({ value: propsValue.quote_id, label: 'Quote ID' })}/issue` });
  },
});

export const bexioRevertQuoteIssue = createAction({
  auth: bexioAuth,
  name: 'bexio_revert_quote_issue',
  classification: 'WRITE',
  displayName: 'Revert Quote to Draft',
  description: 'Revert an issued quote to draft.',
  audience: 'ai',
  aiMetadata: { description: 'Reverts an issued quote back to draft so it can be edited.', idempotent: false },
  outputSchema: bexioOutputSchemas.successOutputSchema,
  props: {
    quote_id: bexioAi.idProp({ displayName: 'Quote ID', description: 'Numeric quote ID. Find it with bexio_search_quotes or bexio_list_quotes.', required: true }),
  },
  async run({ auth, propsValue }) {
    return bexioAi.request({ auth, method: HttpMethod.POST, path: `/2.0/kb_offer/${bexioAi.pathId({ value: propsValue.quote_id, label: 'Quote ID' })}/revertIssue` });
  },
});

export const bexioAcceptQuote = createAction({
  auth: bexioAuth,
  name: 'bexio_accept_quote',
  classification: 'WRITE',
  displayName: 'Accept Quote',
  description: 'Mark a quote as accepted.',
  audience: 'ai',
  aiMetadata: { description: 'Marks an issued quote as accepted by the customer. Then use bexio_create_order_from_quote or bexio_create_invoice_from_quote.', idempotent: false },
  outputSchema: bexioOutputSchemas.successOutputSchema,
  props: {
    quote_id: bexioAi.idProp({ displayName: 'Quote ID', description: 'Numeric quote ID. Find it with bexio_search_quotes or bexio_list_quotes.', required: true }),
  },
  async run({ auth, propsValue }) {
    return bexioAi.request({ auth, method: HttpMethod.POST, path: `/2.0/kb_offer/${bexioAi.pathId({ value: propsValue.quote_id, label: 'Quote ID' })}/accept` });
  },
});

export const bexioDeclineQuote = createAction({
  auth: bexioAuth,
  name: 'bexio_decline_quote',
  classification: 'WRITE',
  displayName: 'Decline Quote',
  description: 'Mark a quote as declined.',
  audience: 'ai',
  aiMetadata: { description: 'Marks an issued quote as declined by the customer. This is a status marker; the quote is kept.', idempotent: false },
  outputSchema: bexioOutputSchemas.successOutputSchema,
  props: {
    quote_id: bexioAi.idProp({ displayName: 'Quote ID', description: 'Numeric quote ID. Find it with bexio_search_quotes or bexio_list_quotes.', required: true }),
  },
  async run({ auth, propsValue }) {
    return bexioAi.request({ auth, method: HttpMethod.POST, path: `/2.0/kb_offer/${bexioAi.pathId({ value: propsValue.quote_id, label: 'Quote ID' })}/reject` });
  },
});

export const bexioMarkQuoteSent = createAction({
  auth: bexioAuth,
  name: 'bexio_mark_quote_sent',
  classification: 'WRITE',
  displayName: 'Mark Quote as Sent',
  description: 'Mark a quote as sent.',
  audience: 'ai',
  aiMetadata: { description: 'Marks an issued quote as sent without emailing it.', idempotent: false },
  outputSchema: bexioOutputSchemas.successOutputSchema,
  props: {
    quote_id: bexioAi.idProp({ displayName: 'Quote ID', description: 'Numeric quote ID. Find it with bexio_search_quotes or bexio_list_quotes.', required: true }),
  },
  async run({ auth, propsValue }) {
    return bexioAi.request({ auth, method: HttpMethod.POST, path: `/2.0/kb_offer/${bexioAi.pathId({ value: propsValue.quote_id, label: 'Quote ID' })}/mark_as_sent` });
  },
});

export const bexioSendQuote = createAction({
  auth: bexioAuth,
  name: 'bexio_send_quote',
  classification: 'WRITE',
  displayName: 'Send Quote',
  description: 'Email the quote.',
  audience: 'ai',
  aiMetadata: { description: 'Emails the quote to a recipient through Bexio. The message must contain the placeholder [Network Link]. Each call sends another email, so do not retry blindly.', idempotent: false },
  outputSchema: bexioOutputSchemas.successOutputSchema,
  props: {
    quote_id: bexioAi.idProp({ displayName: 'Quote ID', description: 'Numeric quote ID. Find it with bexio_search_quotes or bexio_list_quotes.', required: true }),
    recipient_email: Property.ShortText({ displayName: 'Recipient Email', description: 'Recipient email address.', required: true }),
    subject: Property.ShortText({ displayName: 'Subject', description: 'Email subject line.', required: true }),
    message: Property.LongText({ displayName: 'Message', description: 'Email body. Must contain the placeholder [Network Link].', required: true }),
    mark_as_open: bexioAi.flagProp({ displayName: 'Mark As Open', description: 'Set to yes to mark the document as open (issued) when sending.' }),
    attach_pdf: bexioAi.flagProp({ displayName: 'Attach PDF', description: 'Set to yes to attach the PDF.' }),
  },
  async run({ auth, propsValue }) {
    bexioAi.requireNetworkLink({ message: propsValue.message });
    return bexioAi.request({ auth, method: HttpMethod.POST, path: `/2.0/kb_offer/${bexioAi.pathId({ value: propsValue.quote_id, label: 'Quote ID' })}/send`, body: bexioAi.buildBody({ values: propsValue, fields: { recipient_email: 'text', subject: 'text', message: 'text', mark_as_open: 'flag', attach_pdf: 'flag' } }) });
  },
});

export const bexioCopyQuote = createAction({
  auth: bexioAuth,
  name: 'bexio_copy_quote',
  classification: 'WRITE',
  displayName: 'Copy Quote',
  description: 'Copy a quote.',
  audience: 'ai',
  aiMetadata: { description: 'Creates a new draft quote copied from an existing one, for the given customer. Each call creates another copy.', idempotent: false },
  outputSchema: bexioOutputSchemas.quoteOutputSchema,
  props: {
    quote_id: bexioAi.idProp({ displayName: 'Quote ID', description: 'Numeric quote ID. Find it with bexio_search_quotes or bexio_list_quotes.', required: true }),
    contact_id: Property.ShortText({ displayName: 'Contact ID', description: 'Customer contact ID from bexio_search_contacts.', required: true }),
    contact_sub_id: Property.ShortText({ displayName: 'Contact Sub ID', description: 'Optional contact person ID at the customer.', required: false }),
    is_valid_from: Property.ShortText({ displayName: 'Is Valid From', description: 'Document date. Format YYYY-MM-DD. Format YYYY-MM-DD.', required: false }),
    title: Property.ShortText({ displayName: 'Title', description: 'Document title shown on the PDF.', required: false }),
    pr_project_id: Property.ShortText({ displayName: 'Pr Project ID', description: 'Project ID from bexio_search_projects.', required: false }),
  },
  async run({ auth, propsValue }) {
    return bexioAi.request({ auth, method: HttpMethod.POST, path: `/2.0/kb_offer/${bexioAi.pathId({ value: propsValue.quote_id, label: 'Quote ID' })}/copy`, body: bexioAi.buildBody({ values: propsValue, fields: { contact_id: 'id', contact_sub_id: 'id', is_valid_from: 'text', title: 'text', pr_project_id: 'id' } }) });
  },
});

export const bexioGetQuotePdf = createAction({
  auth: bexioAuth,
  name: 'bexio_get_quote_pdf',
  classification: 'READ',
  displayName: 'Get Quote PDF',
  description: 'Download a quote as a PDF file.',
  audience: 'ai',
  aiMetadata: { description: 'Renders the quote as a PDF and returns it as a file. Read-only.', idempotent: true },
  outputSchema: bexioOutputSchemas.pdfOutputSchema,
  props: {
    quote_id: bexioAi.idProp({ displayName: 'Quote ID', description: 'Numeric quote ID. Find it with bexio_search_quotes or bexio_list_quotes.', required: true }),
  },
  async run({ auth, propsValue, files }) {
    const pdf = await bexioAi.request<BexioPdf>({ auth, method: HttpMethod.GET, path: `/2.0/kb_offer/${bexioAi.pathId({ value: propsValue.quote_id, label: 'Quote ID' })}/pdf` });
    return bexioAi.writePdf({ files, pdf, fallbackName: `quote-${propsValue.quote_id}.pdf` });
  },
});

export const bexioCreateOrderFromQuote = createAction({
  auth: bexioAuth,
  name: 'bexio_create_order_from_quote',
  classification: 'WRITE',
  displayName: 'Create Order from Quote',
  description: 'Create a order from the quote. The quote must be accepted first.',
  audience: 'ai',
  aiMetadata: { description: 'Creates a new order from the quote. The quote must be accepted first (bexio_accept_quote); Bexio rejects other quotes with 422. Without positions, every position of the quote is carried over; pass positions to take only some. Each call creates another order.', idempotent: false },
  outputSchema: bexioOutputSchemas.orderOutputSchema,
  props: {
    quote_id: bexioAi.idProp({ displayName: 'Quote ID', description: 'Numeric quote ID. Find it with bexio_search_quotes or bexio_list_quotes.', required: true }),
    positions: Property.Json({ displayName: 'Positions', description: 'Optional JSON array of positions to carry over, each {"id": <position id>, "type": "KbPositionArticle" | "KbPositionCustom" | ..., "amount": <quantity>}. Leave empty to carry over all positions of the source document.', required: false }),
  },
  async run({ auth, propsValue }) {
    const sourceId = bexioAi.pathId({ value: propsValue.quote_id, label: 'Quote ID' });
    const positions = await bexioAi.sourcePositions({ auth, value: propsValue.positions, sourcePath: `/2.0/kb_offer/${sourceId}` });
    return bexioAi.request({ auth, method: HttpMethod.POST, path: `/2.0/kb_offer/${sourceId}/order`, body: { positions } });
  },
});

export const bexioCreateInvoiceFromQuote = createAction({
  auth: bexioAuth,
  name: 'bexio_create_invoice_from_quote',
  classification: 'WRITE',
  displayName: 'Create Invoice from Quote',
  description: 'Create a invoice from the quote. The quote must be accepted first.',
  audience: 'ai',
  aiMetadata: { description: 'Creates a new invoice from the quote. The quote must be accepted first (bexio_accept_quote); Bexio rejects other quotes with 422. Without positions, every position of the quote is carried over; pass positions to take only some. Each call creates another invoice.', idempotent: false },
  outputSchema: bexioOutputSchemas.invoiceOutputSchema,
  props: {
    quote_id: bexioAi.idProp({ displayName: 'Quote ID', description: 'Numeric quote ID. Find it with bexio_search_quotes or bexio_list_quotes.', required: true }),
    positions: Property.Json({ displayName: 'Positions', description: 'Optional JSON array of positions to carry over, each {"id": <position id>, "type": "KbPositionArticle" | "KbPositionCustom" | ..., "amount": <quantity>}. Leave empty to carry over all positions of the source document.', required: false }),
  },
  async run({ auth, propsValue }) {
    const sourceId = bexioAi.pathId({ value: propsValue.quote_id, label: 'Quote ID' });
    const positions = await bexioAi.sourcePositions({ auth, value: propsValue.positions, sourcePath: `/2.0/kb_offer/${sourceId}` });
    return bexioAi.request({ auth, method: HttpMethod.POST, path: `/2.0/kb_offer/${sourceId}/invoice`, body: { positions } });
  },
});

export const bexioDeleteQuote = createAction({
  auth: bexioAuth,
  name: 'bexio_delete_quote',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Quote',
  description: 'Delete a quote.',
  audience: 'ai',
  aiMetadata: { description: 'Permanently deletes a quote. A second call fails.', idempotent: false },
  outputSchema: bexioOutputSchemas.successOutputSchema,
  props: {
    quote_id: bexioAi.idProp({ displayName: 'Quote ID', description: 'Numeric quote ID. Find it with bexio_search_quotes or bexio_list_quotes.', required: true }),
  },
  async run({ auth, propsValue }) {
    return bexioAi.request({ auth, method: HttpMethod.DELETE, path: `/2.0/kb_offer/${bexioAi.pathId({ value: propsValue.quote_id, label: 'Quote ID' })}` });
  },
});
