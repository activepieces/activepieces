import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { invoiceninjaAuth } from '../../common/auth';
import { invoiceNinjaClient } from '../../common/client';
import { entityActions } from '../../common/entity-actions';
import { invoiceNinjaOutputSchemas } from '../../common/output-schemas';
import { invoiceNinjaProps } from '../../common/props';

const PRODUCT_CLEARABLE = ['notes', 'tax_name1'] as const;

export const getCredit = createAction({
  auth: invoiceninjaAuth,
  name: 'get_credit',
  classification: 'READ',
  displayName: 'Get Credit',
  description: 'Get one credit by its ID.',
  audience: 'ai',
  aiMetadata: {
    description: 'Returns one Invoice Ninja credit note by ID with amount, remaining balance and line items. Read-only.',
    idempotent: true,
  },
  outputSchema: invoiceNinjaOutputSchemas.credit,
  props: { id: entityActions.getIdProp('Credit') },
  async run({ auth, propsValue }) {
    return entityActions.runGet({ auth: auth.props, entity: 'credits', label: 'Credit', id: propsValue.id });
  },
});

export const listCredits = createAction({
  auth: invoiceninjaAuth,
  name: 'list_credits',
  classification: 'SEARCH',
  displayName: 'List Credits',
  description: 'List credit notes, one page at a time.',
  audience: 'ai',
  aiMetadata: {
    description: 'Lists Invoice Ninja credit notes, optionally for one client and by free-text search. Returns {items, page, perPage, total, hasMore}. Read-only.',
    idempotent: true,
  },
  outputSchema: invoiceNinjaOutputSchemas.creditList,
  props: {
    client_id: Property.ShortText({ displayName: 'Client ID', required: false }),
    search: Property.ShortText({ displayName: 'Search', required: false }),
    status: entityActions.statusProp(),
    ...entityActions.listProps(),
  },
  async run({ auth, propsValue }) {
    return entityActions.runList({
      auth: auth.props,
      entity: 'credits',
      page: propsValue.page,
      perPage: propsValue.per_page,
      query: {
        client_id: invoiceNinjaClient.optionalId({ value: propsValue.client_id, label: 'Client ID' }),
        filter: invoiceNinjaClient.optionalText(propsValue.search),
        status: propsValue.status,
      },
    });
  },
});

export const createCredit = createAction({
  auth: invoiceninjaAuth,
  name: 'create_credit',
  classification: 'WRITE',
  displayName: 'Create Credit',
  description: 'Create a draft credit note for a client from line items.',
  audience: 'ai',
  aiMetadata: {
    description: 'Creates a draft Invoice Ninja credit note for client_id from line_items (product_key and/or notes, cost, quantity). It can later be applied to invoices in Invoice Ninja. Not idempotent: each call creates a new credit.',
    idempotent: false,
  },
  outputSchema: invoiceNinjaOutputSchemas.credit,
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
      await invoiceNinjaClient.request({ auth: auth.props, method: HttpMethod.POST, path: '/credits', body }),
    );
  },
});

export const getProduct = createAction({
  auth: invoiceninjaAuth,
  name: 'get_product',
  classification: 'READ',
  displayName: 'Get Product',
  description: 'Get one product by its ID.',
  audience: 'ai',
  aiMetadata: {
    description: 'Returns one Invoice Ninja product by ID: product key, description, price, cost and tax. Read-only.',
    idempotent: true,
  },
  outputSchema: invoiceNinjaOutputSchemas.product,
  props: { id: entityActions.getIdProp('Product') },
  async run({ auth, propsValue }) {
    return entityActions.runGet({ auth: auth.props, entity: 'products', label: 'Product', id: propsValue.id });
  },
});

export const listProducts = createAction({
  auth: invoiceninjaAuth,
  name: 'list_products',
  classification: 'SEARCH',
  displayName: 'List Products',
  description: 'List or search products, one page at a time.',
  audience: 'ai',
  aiMetadata: {
    description: 'Lists Invoice Ninja products; search matches product key and description. Returns {items, page, perPage, total, hasMore}. Use the returned price/notes to build invoice line items. Read-only.',
    idempotent: true,
  },
  outputSchema: invoiceNinjaOutputSchemas.productList,
  props: {
    search: Property.ShortText({ displayName: 'Search', required: false }),
    status: entityActions.statusProp(),
    ...entityActions.listProps(),
  },
  async run({ auth, propsValue }) {
    return entityActions.runList({
      auth: auth.props,
      entity: 'products',
      page: propsValue.page,
      perPage: propsValue.per_page,
      query: { filter: invoiceNinjaClient.optionalText(propsValue.search), status: propsValue.status },
    });
  },
});

export const createProduct = createAction({
  auth: invoiceninjaAuth,
  name: 'create_product',
  classification: 'WRITE',
  displayName: 'Create Product',
  description: 'Create a product.',
  audience: 'ai',
  aiMetadata: {
    description: 'Creates an Invoice Ninja product with a product_key (its name/SKU), description, price and optional cost and tax. Product keys are not forced unique, so check List Products first. Not idempotent.',
    idempotent: false,
  },
  outputSchema: invoiceNinjaOutputSchemas.product,
  props: productProps({ forCreate: true }),
  async run({ auth, propsValue }) {
    const body = productBody(propsValue);
    if (body['product_key'] === undefined) throw new Error('Product Key is required.');
    return invoiceNinjaClient.recordOf(
      await invoiceNinjaClient.request({ auth: auth.props, method: HttpMethod.POST, path: '/products', body }),
    );
  },
});

export const updateProduct = createAction({
  auth: invoiceninjaAuth,
  name: 'update_product',
  classification: 'WRITE',
  displayName: 'Update Product',
  description: 'Change fields of a product. Empty fields are left unchanged.',
  audience: 'ai',
  aiMetadata: {
    description: 'Updates an Invoice Ninja product by ID. Only fields you pass change; clear_fields blanks the listed ones. Existing invoices are not changed. Idempotent.',
    idempotent: true,
  },
  outputSchema: invoiceNinjaOutputSchemas.product,
  props: {
    product_id: Property.ShortText({ displayName: 'Product ID', required: true }),
    ...productProps({ forCreate: false }),
    clear_fields: invoiceNinjaProps.clearProp({ fields: PRODUCT_CLEARABLE }),
  },
  async run({ auth, propsValue }) {
    const id = invoiceNinjaClient.parseId({ value: propsValue.product_id, label: 'Product ID' });
    const body = {
      ...invoiceNinjaClient.clearedFields({ value: propsValue.clear_fields, allowed: PRODUCT_CLEARABLE }),
      ...productBody(propsValue),
    };
    if (Object.keys(body).length === 0) throw new Error('Nothing to update: give at least one field or clear_fields.');
    return invoiceNinjaClient.recordOf(
      await invoiceNinjaClient.request({ auth: auth.props, method: HttpMethod.PUT, path: `/products/${id}`, body }),
    );
  },
});

function productProps({ forCreate }: { forCreate: boolean }) {
  return {
    product_key: Property.ShortText({ displayName: 'Product Key', description: 'Product name or SKU.', required: forCreate }),
    notes: Property.LongText({ displayName: 'Description', required: false }),
    price: Property.Number({ displayName: 'Price', required: false }),
    cost: Property.Number({ displayName: 'Cost', description: 'Your purchase cost.', required: false }),
    quantity: Property.Number({ displayName: 'Default Quantity', required: false }),
    tax_name1: Property.ShortText({ displayName: 'Tax Name', required: false }),
    tax_rate1: Property.Number({ displayName: 'Tax Rate (%)', required: false }),
  };
}

function productBody(props: Record<string, unknown>): Record<string, unknown> {
  return invoiceNinjaClient.compact({
    product_key: invoiceNinjaClient.optionalText(props['product_key']),
    notes: invoiceNinjaClient.optionalText(props['notes']),
    price: invoiceNinjaClient.optionalNumber({ value: props['price'], label: 'Price' }),
    cost: invoiceNinjaClient.optionalNumber({ value: props['cost'], label: 'Cost' }),
    quantity: invoiceNinjaClient.optionalNumber({ value: props['quantity'], label: 'Default Quantity', min: 0 }),
    tax_name1: invoiceNinjaClient.optionalText(props['tax_name1']),
    tax_rate1: invoiceNinjaClient.optionalNumber({ value: props['tax_rate1'], label: 'Tax Rate', min: 0, max: 100 }),
  });
}
