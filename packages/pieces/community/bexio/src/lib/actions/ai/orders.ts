import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { bexioAuth } from '../../auth';
import { bexioAi, BexioPdf } from '../../common/ai-helpers';
import { bexioOutputSchemas } from '../../common/output-schemas';

export const bexioListOrders = createAction({
  auth: bexioAuth,
  name: 'bexio_list_orders',
  classification: 'SEARCH',
  displayName: 'List Orders',
  description: 'List sales orders in Bexio.',
  audience: 'ai',
  aiMetadata: { description: 'Lists sales orders in Bexio; pass order_by=id_desc for newest first. Returns one page plus has_more and next_offset; call again with next_offset to continue. Read-only.', idempotent: true },
  outputSchema: bexioOutputSchemas.orderListOutputSchema,
  props: {
    ...bexioAi.listProps({ orderByHint: 'Sort field with optional _asc/_desc suffix, e.g. id_desc or updated_at_desc.' }),
  },
  async run({ auth, propsValue }) {
    return bexioAi.list({ auth, path: `/2.0/kb_order`, limit: propsValue.limit, offset: propsValue.offset, orderBy: propsValue.order_by });
  },
});

export const bexioSearchOrders = createAction({
  auth: bexioAuth,
  name: 'bexio_search_orders',
  classification: 'SEARCH',
  displayName: 'Search Orders',
  description: 'Search sales orders in Bexio by field criteria.',
  audience: 'ai',
  aiMetadata: { description: 'Finds sales orders matching one or two field criteria (operators like, =, >, in, is_null, ...). Use this to resolve an ID by name or number. Read-only.', idempotent: true },
  outputSchema: bexioOutputSchemas.orderListOutputSchema,
  props: {
    ...bexioAi.searchProps({ fieldsHint: 'id, kb_item_status_id, document_nr, title, contact_id, contact_sub_id, user_id, currency_id, total_gross, total_net, total, is_valid_from, is_valid_to, updated_at' }),
    ...bexioAi.listProps({ orderByHint: 'Sort field with optional _asc/_desc suffix, e.g. id_desc or updated_at_desc.' }),
  },
  async run({ auth, propsValue }) {
    return bexioAi.search({ auth, path: `/2.0/kb_order/search`, criteria: bexioAi.searchCriteria({ values: propsValue }), limit: propsValue.limit, offset: propsValue.offset, orderBy: propsValue.order_by });
  },
});

export const bexioGetOrder = createAction({
  auth: bexioAuth,
  name: 'bexio_get_order',
  classification: 'READ',
  displayName: 'Get Order',
  description: 'Get a single sales order by ID.',
  audience: 'ai',
  aiMetadata: { description: 'Fetches one sales order by its numeric ID with all fields. Includes positions and totals. Read-only.', idempotent: true },
  outputSchema: bexioOutputSchemas.orderOutputSchema,
  props: {
    order_id: bexioAi.idProp({ displayName: 'Order ID', description: 'Numeric order ID. Find it with bexio_search_orders or bexio_list_orders.', required: true }),
  },
  async run({ auth, propsValue }) {
    return bexioAi.request({ auth, method: HttpMethod.GET, path: `/2.0/kb_order/${bexioAi.pathId({ value: propsValue.order_id, label: 'Order ID' })}` });
  },
});

export const bexioCreateOrder = createAction({
  auth: bexioAuth,
  name: 'bexio_create_order',
  classification: 'WRITE',
  displayName: 'Create Order',
  description: 'Create a draft order.',
  audience: 'ai',
  aiMetadata: { description: 'Creates a sales order for a customer, with optional positions given as a JSON array. Use bexio_create_order_from_quote when a quote exists. Each call creates a new order.', idempotent: false },
  outputSchema: bexioOutputSchemas.orderOutputSchema,
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
    contact_address_manual: Property.LongText({ displayName: 'Contact Address Manual', description: 'This field can be used to set a contact address manually. If not in use or null the invoice address of the contact will be taken.', required: false }),
    delivery_address_type: Property.Number({ displayName: 'Delivery Address Type', description: '| value | description | |-------|-------------| | 0 | use invoice address | | 1 | use custom address |', required: false }),
    delivery_address_manual: Property.LongText({ displayName: 'Delivery Address Manual', description: 'This field can be used to set a delivery address manually if delivery_address_type is set to 1. If not in use or null the invoice address will be taken.', required: false }),
    api_reference: Property.ShortText({ displayName: 'Api Reference', description: 'This field can only be read and edited by the api. It can be used to save references to other systems.', required: false }),
    template_slug: Property.ShortText({ displayName: 'Template Slug', description: 'References a document template slug', required: false }),
    mwst_type: Property.StaticDropdown<string>({ displayName: 'VAT Mode', description: 'How position prices treat VAT: 0 = prices include VAT, 1 = VAT is added on top of the prices, 2 = VAT exempt (no VAT). Bexio defaults to 2 (exempt) when omitted, so set this for taxable documents.', required: false, options: { disabled: false, options: [{ label: 'Prices include VAT (0)', value: '0' }, { label: 'VAT added on top (1)', value: '1' }, { label: 'VAT exempt (2)', value: '2' }] } }),
    positions: Property.Json({ displayName: 'Positions', description: 'Optional JSON array of positions. Example custom line: [{"type":"KbPositionCustom","amount":"1","unit_price":"100.00","tax_id":3,"text":"Consulting"}]. Article line: {"type":"KbPositionArticle","article_id":1,"amount":"2"}. Tax IDs come from bexio_list_taxes (types=sales_tax, scope=active).', required: false }),
  },
  async run({ auth, propsValue }) {
    const body = bexioAi.buildBody({ values: propsValue, fields: { document_nr: 'text', title: 'text', contact_id: 'id', contact_sub_id: 'id', user_id: 'id', pr_project_id: 'id', logopaper_id: 'id', language_id: 'id', bank_account_id: 'id', currency_id: 'id', payment_type_id: 'id', header: 'text', footer: 'text', mwst_is_net: 'flag', show_position_taxes: 'flag', is_valid_from: 'text', contact_address_manual: 'text', delivery_address_type: 'number', delivery_address_manual: 'text', api_reference: 'text', template_slug: 'text', mwst_type: 'number' } });
    const positions = propsValue.positions === undefined || propsValue.positions === null ? undefined : bexioAi.requireArray({ value: propsValue.positions, key: 'positions' });
    return bexioAi.request({ auth, method: HttpMethod.POST, path: '/2.0/kb_order', body: positions ? { ...body, positions } : body });
  },
});

export const bexioGetOrderPdf = createAction({
  auth: bexioAuth,
  name: 'bexio_get_order_pdf',
  classification: 'READ',
  displayName: 'Get Order PDF',
  description: 'Download an order as a PDF file.',
  audience: 'ai',
  aiMetadata: { description: 'Renders the sales order as a PDF and returns it as a file. Read-only.', idempotent: true },
  outputSchema: bexioOutputSchemas.pdfOutputSchema,
  props: {
    order_id: bexioAi.idProp({ displayName: 'Order ID', description: 'Numeric order ID. Find it with bexio_search_orders or bexio_list_orders.', required: true }),
  },
  async run({ auth, propsValue, files }) {
    const pdf = await bexioAi.request<BexioPdf>({ auth, method: HttpMethod.GET, path: `/2.0/kb_order/${bexioAi.pathId({ value: propsValue.order_id, label: 'Order ID' })}/pdf` });
    return bexioAi.writePdf({ files, pdf, fallbackName: `order-${propsValue.order_id}.pdf` });
  },
});

export const bexioCreateInvoiceFromOrder = createAction({
  auth: bexioAuth,
  name: 'bexio_create_invoice_from_order',
  classification: 'WRITE',
  displayName: 'Create Invoice from Order',
  description: 'Create a invoice from the order.',
  audience: 'ai',
  aiMetadata: { description: 'Creates a new invoice from the order. Without positions, every position of the order is carried over; pass positions to take only some. Each call creates another invoice.', idempotent: false },
  outputSchema: bexioOutputSchemas.invoiceOutputSchema,
  props: {
    order_id: bexioAi.idProp({ displayName: 'Order ID', description: 'Numeric order ID. Find it with bexio_search_orders or bexio_list_orders.', required: true }),
    positions: Property.Json({ displayName: 'Positions', description: 'Optional JSON array of positions to carry over, each {"id": <position id>, "type": "KbPositionArticle" | "KbPositionCustom" | ..., "amount": <quantity>}. Leave empty to carry over all positions of the source document.', required: false }),
  },
  async run({ auth, propsValue }) {
    const sourceId = bexioAi.pathId({ value: propsValue.order_id, label: 'Order ID' });
    const positions = await bexioAi.sourcePositions({ auth, value: propsValue.positions, sourcePath: `/2.0/kb_order/${sourceId}` });
    return bexioAi.request({ auth, method: HttpMethod.POST, path: `/2.0/kb_order/${sourceId}/invoice`, body: { positions } });
  },
});

export const bexioDeleteOrder = createAction({
  auth: bexioAuth,
  name: 'bexio_delete_order',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Order',
  description: 'Delete an order.',
  audience: 'ai',
  aiMetadata: { description: 'Permanently deletes a sales order. A second call fails.', idempotent: false },
  outputSchema: bexioOutputSchemas.successOutputSchema,
  props: {
    order_id: bexioAi.idProp({ displayName: 'Order ID', description: 'Numeric order ID. Find it with bexio_search_orders or bexio_list_orders.', required: true }),
  },
  async run({ auth, propsValue }) {
    return bexioAi.request({ auth, method: HttpMethod.DELETE, path: `/2.0/kb_order/${bexioAi.pathId({ value: propsValue.order_id, label: 'Order ID' })}` });
  },
});
