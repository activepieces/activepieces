import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { bexioAuth } from '../../auth';
import { bexioAi } from '../../common/ai-helpers';
import { bexioOutputSchemas } from '../../common/output-schemas';

export const bexioListItems = createAction({
  auth: bexioAuth,
  name: 'bexio_list_items',
  classification: 'SEARCH',
  displayName: 'List Items',
  description: 'List items (products and services) in Bexio.',
  audience: 'ai',
  aiMetadata: { description: 'Lists items (products and services) in Bexio; pass order_by=id_desc for newest first. Returns one page plus has_more and next_offset; call again with next_offset to continue. Read-only.', idempotent: true },
  outputSchema: bexioOutputSchemas.itemListOutputSchema,
  props: {
    ...bexioAi.listProps({ orderByHint: 'Sort field with optional _asc/_desc suffix, e.g. id_desc or updated_at_desc.' }),
  },
  async run({ auth, propsValue }) {
    return bexioAi.list({ auth, path: `/2.0/article`, limit: propsValue.limit, offset: propsValue.offset, orderBy: propsValue.order_by });
  },
});

export const bexioSearchItems = createAction({
  auth: bexioAuth,
  name: 'bexio_search_items',
  classification: 'SEARCH',
  displayName: 'Search Items',
  description: 'Search items (products and services) in Bexio by field criteria.',
  audience: 'ai',
  aiMetadata: { description: 'Finds items (products and services) matching one or two field criteria (operators like, =, >, in, is_null, ...). Use this to resolve an ID by name or number. Read-only.', idempotent: true },
  outputSchema: bexioOutputSchemas.itemListOutputSchema,
  props: {
    ...bexioAi.searchProps({ fieldsHint: 'intern_name, intern_code' }),
    ...bexioAi.listProps({ orderByHint: 'Sort field with optional _asc/_desc suffix, e.g. id_desc or updated_at_desc.' }),
  },
  async run({ auth, propsValue }) {
    return bexioAi.search({ auth, path: `/2.0/article/search`, criteria: bexioAi.searchCriteria({ values: propsValue }), limit: propsValue.limit, offset: propsValue.offset, orderBy: propsValue.order_by });
  },
});

export const bexioGetItem = createAction({
  auth: bexioAuth,
  name: 'bexio_get_item',
  classification: 'READ',
  displayName: 'Get Item',
  description: 'Get a single item by ID.',
  audience: 'ai',
  aiMetadata: { description: 'Fetches one item by its numeric ID with all fields. Read-only.', idempotent: true },
  outputSchema: bexioOutputSchemas.itemOutputSchema,
  props: {
    article_id: bexioAi.idProp({ displayName: 'Item ID', description: 'Numeric item (article) ID. Find it with bexio_search_items or bexio_list_items.', required: true }),
  },
  async run({ auth, propsValue }) {
    return bexioAi.request({ auth, method: HttpMethod.GET, path: `/2.0/article/${bexioAi.pathId({ value: propsValue.article_id, label: 'Item ID' })}` });
  },
});

export const bexioCreateItem = createAction({
  auth: bexioAuth,
  name: 'bexio_create_item',
  classification: 'WRITE',
  displayName: 'Create Item',
  description: 'Create a product or service item.',
  audience: 'ai',
  aiMetadata: { description: 'Creates a product or service item. Check bexio_search_items first; each call creates a new item.', idempotent: false },
  outputSchema: bexioOutputSchemas.itemOutputSchema,
  props: {
    user_id: Property.ShortText({ displayName: 'User ID', description: 'Responsible Bexio user ID from bexio_get_current_user.', required: true }),
    article_type_id: Property.ShortText({ displayName: 'Article Type ID', description: 'Item type: 1 = physical product, 2 = service.', required: true }),
    contact_id: Property.ShortText({ displayName: 'Contact ID', description: 'Supplier contact ID from bexio_search_contacts.', required: false }),
    deliverer_code: Property.ShortText({ displayName: 'Deliverer Code', description: 'Supplier item code.', required: false }),
    deliverer_name: Property.ShortText({ displayName: 'Deliverer Name', description: 'Supplier item name.', required: false }),
    deliverer_description: Property.LongText({ displayName: 'Deliverer Description', description: 'Supplier item description.', required: false }),
    intern_code: Property.ShortText({ displayName: 'Intern Code', description: 'Item code (SKU), unique per item.', required: false }),
    intern_name: Property.ShortText({ displayName: 'Intern Name', description: 'Item name used inside Bexio and on documents.', required: true }),
    intern_description: Property.LongText({ displayName: 'Intern Description', description: 'Item description used on documents.', required: false }),
    purchase_price: Property.ShortText({ displayName: 'Purchase Price', description: 'Purchase price as a decimal string, e.g. 12.50.', required: false }),
    sale_price: Property.ShortText({ displayName: 'Sale Price', description: 'Sale price as a decimal string, e.g. 19.90.', required: false }),
    purchase_total: Property.Number({ displayName: 'Purchase Total', description: 'Purchase price total as a number.', required: false }),
    sale_total: Property.Number({ displayName: 'Sale Total', description: 'Sale price total as a number.', required: false }),
    currency_id: Property.ShortText({ displayName: 'Currency ID', description: 'Currency ID from bexio_list_currencies.', required: false }),
    tax_income_id: Property.ShortText({ displayName: 'Tax Income ID', description: 'Sales tax ID from bexio_list_taxes.', required: false }),
    tax_expense_id: Property.ShortText({ displayName: 'Tax Expense ID', description: 'Purchase tax ID from bexio_list_taxes.', required: false }),
    unit_id: Property.ShortText({ displayName: 'Unit ID', description: 'Unit ID from bexio_list_units.', required: false }),
    is_stock: bexioAi.flagProp({ displayName: 'Is Stock', description: 'Whether the item is stock-managed.' }),
    stock_id: Property.ShortText({ displayName: 'Stock ID', description: 'References a stock location object', required: false }),
    stock_place_id: Property.ShortText({ displayName: 'Stock Place ID', description: 'References a stock area object', required: false }),
    stock_nr: Property.Number({ displayName: 'Stock Number', description: 'Please note that the stock number can only be set if no bookings for this product have been made.', required: false }),
    stock_min_nr: Property.Number({ displayName: 'Stock Min Number', description: 'Minimum stock level.', required: false }),
    width: Property.Number({ displayName: 'Width', description: 'Width as a whole number.', required: false }),
    height: Property.Number({ displayName: 'Height', description: 'Height as a whole number.', required: false }),
    weight: Property.Number({ displayName: 'Weight', description: 'Weight as a whole number.', required: false }),
    volume: Property.Number({ displayName: 'Volume', description: 'Volume as a whole number.', required: false }),
    html_text: Property.LongText({ displayName: 'Html Text', description: 'Long item description as HTML.', required: false }),
    remarks: Property.LongText({ displayName: 'Remarks', description: 'Internal remarks.', required: false }),
    delivery_price: Property.Number({ displayName: 'Delivery Price', description: 'Delivery price as a number.', required: false }),
    article_group_id: Property.ShortText({ displayName: 'Article Group ID', description: 'Numeric Bexio Article Group ID.', required: false }),
    account_id: Property.ShortText({ displayName: 'Account ID', description: 'Revenue account ID from bexio_search_accounts.', required: false }),
    expense_account_id: Property.ShortText({ displayName: 'Expense Account ID', description: 'Expense account ID from bexio_search_accounts.', required: false }),
  },
  async run({ auth, propsValue }) {
    return bexioAi.request({ auth, method: HttpMethod.POST, path: `/2.0/article`, body: bexioAi.buildBody({ values: propsValue, fields: { user_id: 'id', article_type_id: 'id', contact_id: 'id', deliverer_code: 'text', deliverer_name: 'text', deliverer_description: 'text', intern_code: 'text', intern_name: 'text', intern_description: 'text', purchase_price: 'decimal', sale_price: 'decimal', purchase_total: 'number', sale_total: 'number', currency_id: 'id', tax_income_id: 'id', tax_expense_id: 'id', unit_id: 'id', is_stock: 'flag', stock_id: 'id', stock_place_id: 'id', stock_nr: 'number', stock_min_nr: 'number', width: 'number', height: 'number', weight: 'number', volume: 'number', html_text: 'text', remarks: 'text', delivery_price: 'number', article_group_id: 'id', account_id: 'id', expense_account_id: 'id' } }) });
  },
});

export const bexioUpdateItem = createAction({
  auth: bexioAuth,
  name: 'bexio_update_item',
  classification: 'WRITE',
  displayName: 'Update Item',
  description: 'Update fields on an item.',
  audience: 'ai',
  aiMetadata: { description: 'Changes only the given fields of an existing item; omitted fields keep their value. Numbers can be set to 0. Stock management (is_stock) can only be set at creation. Safe to retry.', idempotent: true },
  outputSchema: bexioOutputSchemas.itemOutputSchema,
  props: {
    article_id: bexioAi.idProp({ displayName: 'Item ID', description: 'Numeric item (article) ID. Find it with bexio_search_items or bexio_list_items.', required: true }),
    user_id: Property.ShortText({ displayName: 'User ID', description: 'Responsible Bexio user ID from bexio_get_current_user.', required: false }),
    contact_id: Property.ShortText({ displayName: 'Contact ID', description: 'Supplier contact ID from bexio_search_contacts.', required: false }),
    deliverer_code: Property.ShortText({ displayName: 'Deliverer Code', description: 'Supplier item code.', required: false }),
    deliverer_name: Property.ShortText({ displayName: 'Deliverer Name', description: 'Supplier item name.', required: false }),
    deliverer_description: Property.LongText({ displayName: 'Deliverer Description', description: 'Supplier item description.', required: false }),
    intern_code: Property.ShortText({ displayName: 'Intern Code', description: 'Item code (SKU), unique per item.', required: false }),
    intern_name: Property.ShortText({ displayName: 'Intern Name', description: 'Item name used inside Bexio and on documents.', required: false }),
    intern_description: Property.LongText({ displayName: 'Intern Description', description: 'Item description used on documents.', required: false }),
    purchase_price: Property.ShortText({ displayName: 'Purchase Price', description: 'Purchase price as a decimal string, e.g. 12.50.', required: false }),
    sale_price: Property.ShortText({ displayName: 'Sale Price', description: 'Sale price as a decimal string, e.g. 19.90.', required: false }),
    purchase_total: Property.Number({ displayName: 'Purchase Total', description: 'Purchase price total as a number.', required: false }),
    sale_total: Property.Number({ displayName: 'Sale Total', description: 'Sale price total as a number.', required: false }),
    currency_id: Property.ShortText({ displayName: 'Currency ID', description: 'Currency ID from bexio_list_currencies.', required: false }),
    tax_income_id: Property.ShortText({ displayName: 'Tax Income ID', description: 'Sales tax ID from bexio_list_taxes.', required: false }),
    tax_expense_id: Property.ShortText({ displayName: 'Tax Expense ID', description: 'Purchase tax ID from bexio_list_taxes.', required: false }),
    unit_id: Property.ShortText({ displayName: 'Unit ID', description: 'Unit ID from bexio_list_units.', required: false }),
    stock_id: Property.ShortText({ displayName: 'Stock ID', description: 'References a stock location object', required: false }),
    stock_place_id: Property.ShortText({ displayName: 'Stock Place ID', description: 'References a stock area object', required: false }),
    stock_nr: Property.Number({ displayName: 'Stock Number', description: 'Please note that the stock number can only be set if no bookings for this product have been made.', required: false }),
    stock_min_nr: Property.Number({ displayName: 'Stock Min Number', description: 'Minimum stock level.', required: false }),
    width: Property.Number({ displayName: 'Width', description: 'Width as a whole number.', required: false }),
    height: Property.Number({ displayName: 'Height', description: 'Height as a whole number.', required: false }),
    weight: Property.Number({ displayName: 'Weight', description: 'Weight as a whole number.', required: false }),
    volume: Property.Number({ displayName: 'Volume', description: 'Volume as a whole number.', required: false }),
    html_text: Property.LongText({ displayName: 'Html Text', description: 'Long item description as HTML.', required: false }),
    remarks: Property.LongText({ displayName: 'Remarks', description: 'Internal remarks.', required: false }),
    delivery_price: Property.Number({ displayName: 'Delivery Price', description: 'Delivery price as a number.', required: false }),
    article_group_id: Property.ShortText({ displayName: 'Article Group ID', description: 'Numeric Bexio Article Group ID.', required: false }),
    account_id: Property.ShortText({ displayName: 'Account ID', description: 'Revenue account ID from bexio_search_accounts.', required: false }),
    expense_account_id: Property.ShortText({ displayName: 'Expense Account ID', description: 'Expense account ID from bexio_search_accounts.', required: false }),
  },
  async run({ auth, propsValue }) {
    return bexioAi.request({ auth, method: HttpMethod.POST, path: `/2.0/article/${bexioAi.pathId({ value: propsValue.article_id, label: 'Item ID' })}`, body: bexioAi.requireAny(bexioAi.buildBody({ values: propsValue, fields: { user_id: 'id', contact_id: 'id', deliverer_code: 'text', deliverer_name: 'text', deliverer_description: 'text', intern_code: 'text', intern_name: 'text', intern_description: 'text', purchase_price: 'decimal', sale_price: 'decimal', purchase_total: 'number', sale_total: 'number', currency_id: 'id', tax_income_id: 'id', tax_expense_id: 'id', unit_id: 'id', stock_id: 'id', stock_place_id: 'id', stock_nr: 'number', stock_min_nr: 'number', width: 'number', height: 'number', weight: 'number', volume: 'number', html_text: 'text', remarks: 'text', delivery_price: 'number', article_group_id: 'id', account_id: 'id', expense_account_id: 'id' } })) });
  },
});

export const bexioDeleteItem = createAction({
  auth: bexioAuth,
  name: 'bexio_delete_item',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Item',
  description: 'Delete an item.',
  audience: 'ai',
  aiMetadata: { description: 'Permanently deletes an item. A second call fails because the item is gone.', idempotent: false },
  outputSchema: bexioOutputSchemas.successOutputSchema,
  props: {
    article_id: bexioAi.idProp({ displayName: 'Item ID', description: 'Numeric item (article) ID. Find it with bexio_search_items or bexio_list_items.', required: true }),
  },
  async run({ auth, propsValue }) {
    return bexioAi.request({ auth, method: HttpMethod.DELETE, path: `/2.0/article/${bexioAi.pathId({ value: propsValue.article_id, label: 'Item ID' })}` });
  },
});

export const bexioListUnits = createAction({
  auth: bexioAuth,
  name: 'bexio_list_units',
  classification: 'SEARCH',
  displayName: 'List Units',
  description: 'List units of measure in Bexio.',
  audience: 'ai',
  aiMetadata: { description: 'Lists units of measure in Bexio. Use the IDs as unit_id on items and positions. Returns one page plus has_more and next_offset; call again with next_offset to continue. Read-only.', idempotent: true },
  outputSchema: bexioOutputSchemas.namedListOutputSchema,
  props: {
    ...bexioAi.listProps({}),
  },
  async run({ auth, propsValue }) {
    return bexioAi.list({ auth, path: `/2.0/unit`, limit: propsValue.limit, offset: propsValue.offset });
  },
});
