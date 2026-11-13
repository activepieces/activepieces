import { HttpMethod } from '@activepieces/pieces-common';
import { squareClient, SquareAuth } from './client';
import { squareInputs } from './inputs';
import { squareMoney } from './money';
import { squareShape } from './shape';

const MAX_LINE_ITEMS = 100;
const ORDER_SEARCH_MAX_LOCATIONS = 10;

const { request } = squareClient;

async function getCustomer({ auth, customerId }: { auth: SquareAuth; customerId: string }) {
  const body = await request<unknown>({ auth, method: HttpMethod.GET, path: ['v2', 'customers', customerId], operation: `read customer "${customerId}"` });
  return squareShape.customer(squareShape.requireObject({ body, key: 'customer', what: 'customer' }));
}

function customerFields(props: Record<string, unknown>): Record<string, unknown> {
  const address = {
    address_line_1: squareInputs.text(props['address_line_1']),
    address_line_2: squareInputs.text(props['address_line_2']),
    locality: squareInputs.text(props['city']),
    administrative_district_level_1: squareInputs.text(props['state']),
    postal_code: squareInputs.text(props['postal_code']),
    country: squareInputs.text(props['country'])?.toUpperCase(),
  };
  const hasAddress = Object.values(address).some((value) => value !== undefined);
  return dropUndefined({
    given_name: squareInputs.text(props['given_name']),
    family_name: squareInputs.text(props['family_name']),
    company_name: squareInputs.text(props['company_name']),
    nickname: squareInputs.text(props['nickname']),
    email_address: squareInputs.email({ value: props['email_address'], label: 'Email' }),
    phone_number: squareInputs.text(props['phone_number']),
    birthday: squareInputs.dateOnly({ value: props['birthday'], label: 'Birthday' }),
    note: squareInputs.text(props['note']),
    reference_id: squareInputs.text(props['reference_id']),
    address: hasAddress ? dropUndefined(address) : undefined,
  });
}

async function updateCustomer({ auth, customerId, props }: { auth: SquareAuth; customerId: string; props: Record<string, unknown> }) {
  const fields = customerFields(props);
  const clear = clearList(props['clear_fields']);
  const clears = Object.fromEntries(clear.filter((name) => fields[name] === undefined).map((name) => [name, null]));
  const changes = { ...clears, ...fields };
  if (Object.keys(changes).length === 0) {
    throw new Error('Nothing to update. Fill at least one field or pick a field to clear.');
  }
  const current = await getCustomer({ auth, customerId });
  const body = await request<unknown>({
    auth,
    method: HttpMethod.PUT,
    path: ['v2', 'customers', customerId],
    body: { ...changes, version: current.version ?? undefined },
    operation: `update customer "${customerId}"`,
  });
  return squareShape.customer(squareShape.requireObject({ body, key: 'customer', what: 'customer' }));
}

async function deleteCustomer({ auth, customerId }: { auth: SquareAuth; customerId: string }) {
  await request<unknown>({ auth, method: HttpMethod.DELETE, path: ['v2', 'customers', customerId], operation: `delete customer "${customerId}"` });
  return { id: customerId, deleted: true };
}

async function retrieveObject({ auth, objectId }: { auth: SquareAuth; objectId: string }) {
  const body = await request<unknown>({
    auth,
    method: HttpMethod.GET,
    path: ['v2', 'catalog', 'object', objectId],
    operation: `read catalog object "${objectId}"`,
  });
  return squareShape.requireObject({ body, key: 'object', what: 'catalog object' });
}

async function createCatalogItem({ auth, props, idempotencyKey }: { auth: SquareAuth; props: Record<string, unknown>; idempotencyKey: string }) {
  const name = squareInputs.requireText({ value: props['name'], label: 'Name' });
  const categoryId = squareInputs.optionalId({ value: props['category_id'], label: 'Category' });
  const priceText = squareInputs.text(props['price']);
  const currency = priceText === undefined ? undefined : await currencyFor({ auth, currency: props['currency'], locationId: undefined });
  const variationData = dropUndefined({
    item_id: '#item',
    name: squareInputs.text(props['variation_name']) ?? 'Regular',
    sku: squareInputs.text(props['sku']),
    pricing_type: priceText === undefined ? 'VARIABLE_PRICING' : 'FIXED_PRICING',
    price_money: priceText === undefined || currency === undefined ? undefined : { amount: squareMoney.toMinor({ amount: priceText, currency, label: 'Price', allowZero: true }), currency },
  });
  const body = await request<unknown>({
    auth,
    method: HttpMethod.POST,
    path: ['v2', 'catalog', 'object'],
    body: {
      idempotency_key: idempotencyKey,
      object: {
        type: 'ITEM',
        id: '#item',
        present_at_all_locations: true,
        item_data: dropUndefined({
          name,
          description: squareInputs.text(props['description']),
          categories: categoryId ? [{ id: categoryId }] : undefined,
          variations: [{ type: 'ITEM_VARIATION', id: '#variation', present_at_all_locations: true, item_variation_data: variationData }],
        }),
      },
    },
    operation: 'create the catalog item',
  });
  return squareShape.catalogItem(squareShape.requireObject({ body, key: 'catalog_object', what: 'catalog item' }));
}

async function updateVariation({ auth, variationId, props, idempotencyKey }: { auth: SquareAuth; variationId: string; props: Record<string, unknown>; idempotencyKey: string }) {
  const priceText = squareInputs.text(props['price']);
  const sku = squareInputs.text(props['sku']);
  const name = squareInputs.text(props['name']);
  if (priceText === undefined && sku === undefined && name === undefined) {
    throw new Error('Nothing to update. Fill Price, SKU or Name.');
  }
  const current = await retrieveObject({ auth, objectId: variationId });
  if (current['type'] !== 'ITEM_VARIATION') {
    throw new Error(`Catalog object "${variationId}" is a ${String(current['type'])}, not an item variation. Use the variation ID (from Search Catalog Items > variations).`);
  }
  const data = squareShape.rec({ value: current, key: 'item_variation_data' });
  const existingCurrency = squareShape.str({ value: squareShape.rec({ value: data, key: 'price_money' }), key: 'currency' });
  const currency = priceText === undefined ? undefined : squareMoney.normalizeCurrency(props['currency']) ?? existingCurrency ?? (await currencyFor({ auth, currency: undefined, locationId: undefined }));
  const updatedData = {
    ...data,
    ...(name === undefined ? {} : { name }),
    ...(sku === undefined ? {} : { sku }),
    ...(priceText === undefined || currency === undefined
      ? {}
      : { pricing_type: 'FIXED_PRICING', price_money: { amount: squareMoney.toMinor({ amount: priceText, currency, label: 'Price', allowZero: true }), currency } }),
  };
  const body = await request<unknown>({
    auth,
    method: HttpMethod.POST,
    path: ['v2', 'catalog', 'object'],
    body: { idempotency_key: idempotencyKey, object: { ...current, item_variation_data: updatedData } },
    operation: `update variation "${variationId}"`,
  });
  return squareShape.variation(squareShape.requireObject({ body, key: 'catalog_object', what: 'catalog variation' }));
}

async function getInventory({ auth, variationIds, locationIds, limit, cursor }: { auth: SquareAuth; variationIds: string[]; locationIds: string[]; limit: number; cursor: string | undefined }) {
  if (variationIds.length === 0) {
    throw new Error('Give at least one variation ID.');
  }
  const body = await request<unknown>({
    auth,
    method: HttpMethod.POST,
    path: ['v2', 'inventory', 'counts', 'batch-retrieve'],
    body: dropUndefined({ catalog_object_ids: variationIds, location_ids: locationIds.length > 0 ? locationIds : undefined, limit, cursor }),
    operation: 'read inventory counts',
  });
  return squareShape.page({ items: squareShape.list({ value: body, key: 'counts' }).map(squareShape.inventoryCount), cursor: squareShape.str({ value: body, key: 'cursor' }) });
}

async function changeInventory({ auth, change, idempotencyKey }: { auth: SquareAuth; change: Record<string, unknown>; idempotencyKey: string }) {
  const body = await request<unknown>({
    auth,
    method: HttpMethod.POST,
    path: ['v2', 'inventory', 'changes', 'batch-create'],
    body: { idempotency_key: idempotencyKey, changes: [change], ignore_unchanged_counts: false },
    operation: 'change the inventory count',
  });
  return squareShape.page({ items: squareShape.list({ value: body, key: 'counts' }).map(squareShape.inventoryCount), cursor: null });
}

function adjustmentChange({ variationId, locationId, quantity, reason }: { variationId: string; locationId: string; quantity: string; reason: string }) {
  const states = ADJUSTMENT_STATES[reason];
  if (!states) {
    throw new Error(`Reason "${reason}" is not supported. Use one of: ${Object.keys(ADJUSTMENT_STATES).join(', ')}.`);
  }
  return {
    type: 'ADJUSTMENT',
    adjustment: { catalog_object_id: variationId, from_location_id: locationId, to_location_id: locationId, from_state: states.from, to_state: states.to, quantity },
  };
}

function physicalCountChange({ variationId, locationId, quantity }: { variationId: string; locationId: string; quantity: string }) {
  return { type: 'PHYSICAL_COUNT', physical_count: { catalog_object_id: variationId, location_id: locationId, state: 'IN_STOCK', quantity } };
}

async function currencyFor({ auth, currency, locationId }: { auth: SquareAuth; currency: unknown; locationId: string | undefined }): Promise<string> {
  const explicit = squareMoney.normalizeCurrency(currency);
  if (explicit) {
    return explicit;
  }
  const location = await squareClient.resolveLocation({ auth, locationId });
  const found = squareShape.str({ value: location, key: 'currency' });
  if (!found) {
    throw new Error('Could not find the currency of the location. Fill Currency.');
  }
  return found;
}

function buildLineItems({ items, currency }: { items: unknown; currency: string }) {
  const rows = Array.isArray(items) ? items.filter(squareShape.isRecord) : [];
  if (rows.length === 0) {
    throw new Error('Add at least one line item.');
  }
  if (rows.length > MAX_LINE_ITEMS) {
    throw new Error(`At most ${MAX_LINE_ITEMS} line items are allowed per order.`);
  }
  return rows.map((row, index) => {
    const label = `Line item ${index + 1}`;
    const variationId = squareInputs.optionalId({ value: row['variation_id'] ?? row['catalog_object_id'], label: `${label} variation ID` });
    const name = squareInputs.text(row['name']);
    const price = squareInputs.text(row['price'] ?? row['amount']);
    const quantity = squareMoney.quantity({ value: squareInputs.text(row['quantity']) ?? '1', label: `${label} quantity`, wholeOnly: true });
    const note = squareInputs.text(row['note']);
    if (variationId) {
      if (price !== undefined) {
        return dropUndefined({ catalog_object_id: variationId, quantity, note, base_price_money: { amount: squareMoney.toMinor({ amount: price, currency, label: `${label} price`, allowZero: true }), currency } });
      }
      return dropUndefined({ catalog_object_id: variationId, quantity, note });
    }
    if (!name || price === undefined) {
      throw new Error(`${label}: pick a catalog item (variation ID), or give both a name and a price.`);
    }
    return dropUndefined({ name, quantity, note, base_price_money: { amount: squareMoney.toMinor({ amount: price, currency, label: `${label} price`, allowZero: true }), currency } });
  });
}

async function createOrder({
  auth,
  locationId,
  customerId,
  referenceId,
  items,
  idempotencyKey,
}: {
  auth: SquareAuth;
  locationId: string | undefined;
  customerId: string | undefined;
  referenceId: string | undefined;
  items: unknown;
  idempotencyKey: string;
}) {
  const location = await squareClient.resolveLocation({ auth, locationId });
  const currency = squareShape.str({ value: location, key: 'currency' }) ?? 'USD';
  const lineItems = buildLineItems({ items, currency });
  const body = await request<unknown>({
    auth,
    method: HttpMethod.POST,
    path: ['v2', 'orders'],
    body: {
      idempotency_key: idempotencyKey,
      order: dropUndefined({ location_id: String(location['id']), customer_id: customerId, reference_id: referenceId, line_items: lineItems }),
    },
    operation: 'create the order',
  });
  return squareShape.order(squareShape.requireObject({ body, key: 'order', what: 'order' }));
}

async function setOrderState({ auth, orderId, state, idempotencyKey }: { auth: SquareAuth; orderId: string; state: string; idempotencyKey: string }) {
  const current = await request<unknown>({ auth, method: HttpMethod.GET, path: ['v2', 'orders', orderId], operation: `read order "${orderId}"` });
  const order = squareShape.requireObject({ body: current, key: 'order', what: 'order' });
  const body = await request<unknown>({
    auth,
    method: HttpMethod.PUT,
    path: ['v2', 'orders', orderId],
    body: { idempotency_key: idempotencyKey, order: { location_id: order['location_id'], version: order['version'], state } },
    operation: `set order "${orderId}" to ${state}`,
  });
  return squareShape.order(squareShape.requireObject({ body, key: 'order', what: 'order' }));
}

async function searchOrders({
  auth,
  locationIds,
  states,
  createdAfter,
  createdBefore,
  customerIds,
  limit,
  cursor,
}: {
  auth: SquareAuth;
  locationIds: string[];
  states: string[];
  createdAfter: string | undefined;
  createdBefore: string | undefined;
  customerIds: string[];
  limit: number;
  cursor: string | undefined;
}) {
  const ids = locationIds.length > 0 ? locationIds : await activeLocationIds({ auth });
  if (ids.length > ORDER_SEARCH_MAX_LOCATIONS) {
    throw new Error(`Search Orders covers at most ${ORDER_SEARCH_MAX_LOCATIONS} locations per call. Pick the locations to search.`);
  }
  const filter = dropUndefined({
    state_filter: states.length > 0 ? { states } : undefined,
    date_time_filter: createdAfter || createdBefore ? { created_at: dropUndefined({ start_at: createdAfter, end_at: createdBefore }) } : undefined,
    customer_filter: customerIds.length > 0 ? { customer_ids: customerIds } : undefined,
  });
  const body = await request<unknown>({
    auth,
    method: HttpMethod.POST,
    path: ['v2', 'orders', 'search'],
    body: dropUndefined({ location_ids: ids, limit, cursor, return_entries: false, query: { filter, sort: { sort_field: 'CREATED_AT', sort_order: 'DESC' } } }),
    operation: 'search orders',
  });
  return squareShape.page({ items: squareShape.list({ value: body, key: 'orders' }).map(squareShape.order), cursor: squareShape.str({ value: body, key: 'cursor' }) });
}

async function activeLocationIds({ auth }: { auth: SquareAuth }): Promise<string[]> {
  const body = await request<unknown>({ auth, method: HttpMethod.GET, path: ['v2', 'locations'], operation: 'list locations' });
  return squareShape
    .list({ value: body, key: 'locations' })
    .filter((l) => l['status'] === 'ACTIVE' && typeof l['id'] === 'string')
    .map((l) => String(l['id']));
}

async function createPaymentLink({
  auth,
  locationId,
  name,
  amount,
  currency,
  description,
  redirectUrl,
  paymentNote,
  idempotencyKey,
}: {
  auth: SquareAuth;
  locationId: string | undefined;
  name: string;
  amount: unknown;
  currency: unknown;
  description: string | undefined;
  redirectUrl: string | undefined;
  paymentNote: string | undefined;
  idempotencyKey: string;
}) {
  const location = await squareClient.resolveLocation({ auth, locationId });
  const resolvedCurrency = squareMoney.normalizeCurrency(currency) ?? squareShape.str({ value: location, key: 'currency' });
  if (!resolvedCurrency) {
    throw new Error('Could not find the currency of the location. Fill Currency.');
  }
  const body = await request<unknown>({
    auth,
    method: HttpMethod.POST,
    path: ['v2', 'online-checkout', 'payment-links'],
    body: dropUndefined({
      idempotency_key: idempotencyKey,
      description,
      payment_note: paymentNote,
      quick_pay: {
        name,
        location_id: String(location['id']),
        price_money: { amount: squareMoney.toMinor({ amount, currency: resolvedCurrency, label: 'Amount' }), currency: resolvedCurrency },
      },
      checkout_options: redirectUrl ? { redirect_url: redirectUrl } : undefined,
    }),
    operation: 'create the payment link',
  });
  return squareShape.paymentLink(squareShape.requireObject({ body, key: 'payment_link', what: 'payment link' }));
}

function clearList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string' && CLEARABLE_CUSTOMER_FIELDS.includes(item)) : [];
}

function dropUndefined<T extends Record<string, unknown>>(value: T): Record<string, unknown> {
  return Object.fromEntries(Object.entries(value).filter((entry) => entry[1] !== undefined));
}

const ADJUSTMENT_STATES: Record<string, { from: string; to: string }> = {
  RECEIVED: { from: 'NONE', to: 'IN_STOCK' },
  SOLD: { from: 'IN_STOCK', to: 'SOLD' },
  WASTE: { from: 'IN_STOCK', to: 'WASTE' },
};

const CLEARABLE_CUSTOMER_FIELDS = ['given_name', 'family_name', 'company_name', 'nickname', 'email_address', 'phone_number', 'birthday', 'note', 'reference_id', 'address'];

export const squareOps = {
  getCustomer,
  customerFields,
  updateCustomer,
  deleteCustomer,
  retrieveObject,
  createCatalogItem,
  updateVariation,
  getInventory,
  changeInventory,
  adjustmentChange,
  physicalCountChange,
  currencyFor,
  createOrder,
  setOrderState,
  searchOrders,
  activeLocationIds,
  createPaymentLink,
  dropUndefined,
  ADJUSTMENT_STATES,
  CLEARABLE_CUSTOMER_FIELDS,
};
