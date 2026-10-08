import { squareMoney } from './money';

const MAX_LINE_ITEMS = 100;
const MAX_VARIATIONS = 50;

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function rec({ value, key }: { value: unknown; key: string }): Record<string, unknown> {
  if (!isRecord(value)) {
    return {};
  }
  const inner = value[key];
  return isRecord(inner) ? inner : {};
}

function str({ value, key }: { value: unknown; key: string }): string | null {
  if (!isRecord(value)) {
    return null;
  }
  const inner = value[key];
  return typeof inner === 'string' ? inner : typeof inner === 'number' ? String(inner) : null;
}

function num({ value, key }: { value: unknown; key: string }): number | null {
  if (!isRecord(value)) {
    return null;
  }
  const inner = value[key];
  return typeof inner === 'number' && Number.isFinite(inner) ? inner : null;
}

function flag({ value, key }: { value: unknown; key: string }): boolean | null {
  if (!isRecord(value)) {
    return null;
  }
  const inner = value[key];
  return typeof inner === 'boolean' ? inner : null;
}

function list({ value, key }: { value: unknown; key: string }): Record<string, unknown>[] {
  if (!isRecord(value)) {
    return [];
  }
  const inner = value[key];
  return Array.isArray(inner) ? inner.filter(isRecord) : [];
}

function strings({ value, key }: { value: unknown; key: string }): string[] {
  if (!isRecord(value)) {
    return [];
  }
  const inner = value[key];
  return Array.isArray(inner) ? inner.filter((item): item is string => typeof item === 'string') : [];
}

function money({ value, key }: { value: unknown; key: string }): { amount: string | null; minor: number | null; currency: string | null } {
  const inner = rec({ value: value, key: key });
  const minor = num({ value: inner, key: 'amount' });
  const currency = str({ value: inner, key: 'currency' });
  if (minor === null || currency === null) {
    return { amount: null, minor: null, currency };
  }
  return { amount: squareMoney.format({ minor, currency }), minor, currency };
}

function address(value: unknown): Record<string, string | null> {
  const a = rec({ value: value, key: 'address' });
  return {
    address_line_1: str({ value: a, key: 'address_line_1' }),
    address_line_2: str({ value: a, key: 'address_line_2' }),
    city: str({ value: a, key: 'locality' }),
    state: str({ value: a, key: 'administrative_district_level_1' }),
    postal_code: str({ value: a, key: 'postal_code' }),
    country: str({ value: a, key: 'country' }),
  };
}

function customer(c: unknown) {
  return {
    id: str({ value: c, key: 'id' }),
    given_name: str({ value: c, key: 'given_name' }),
    family_name: str({ value: c, key: 'family_name' }),
    company_name: str({ value: c, key: 'company_name' }),
    nickname: str({ value: c, key: 'nickname' }),
    email_address: str({ value: c, key: 'email_address' }),
    phone_number: str({ value: c, key: 'phone_number' }),
    birthday: str({ value: c, key: 'birthday' }),
    note: str({ value: c, key: 'note' }),
    reference_id: str({ value: c, key: 'reference_id' }),
    ...address(c),
    email_unsubscribed: flag({ value: rec({ value: c, key: 'preferences' }), key: 'email_unsubscribed' }),
    creation_source: str({ value: c, key: 'creation_source' }),
    group_ids: strings({ value: c, key: 'group_ids' }),
    version: num({ value: c, key: 'version' }),
    created_at: str({ value: c, key: 'created_at' }),
    updated_at: str({ value: c, key: 'updated_at' }),
  };
}

function location(l: unknown) {
  return {
    id: str({ value: l, key: 'id' }),
    name: str({ value: l, key: 'name' }),
    business_name: str({ value: l, key: 'business_name' }),
    status: str({ value: l, key: 'status' }),
    type: str({ value: l, key: 'type' }),
    country: str({ value: l, key: 'country' }),
    currency: str({ value: l, key: 'currency' }),
    timezone: str({ value: l, key: 'timezone' }),
    language_code: str({ value: l, key: 'language_code' }),
    ...address(l),
    phone_number: str({ value: l, key: 'phone_number' }),
    business_email: str({ value: l, key: 'business_email' }),
    website_url: str({ value: l, key: 'website_url' }),
    capabilities: strings({ value: l, key: 'capabilities' }),
    merchant_id: str({ value: l, key: 'merchant_id' }),
    created_at: str({ value: l, key: 'created_at' }),
  };
}

function merchant(m: unknown) {
  return {
    id: str({ value: m, key: 'id' }),
    business_name: str({ value: m, key: 'business_name' }),
    country: str({ value: m, key: 'country' }),
    language_code: str({ value: m, key: 'language_code' }),
    currency: str({ value: m, key: 'currency' }),
    status: str({ value: m, key: 'status' }),
    main_location_id: str({ value: m, key: 'main_location_id' }),
    created_at: str({ value: m, key: 'created_at' }),
  };
}

function teamMember(t: unknown) {
  const assigned = rec({ value: t, key: 'assigned_locations' });
  return {
    id: str({ value: t, key: 'id' }),
    given_name: str({ value: t, key: 'given_name' }),
    family_name: str({ value: t, key: 'family_name' }),
    email_address: str({ value: t, key: 'email_address' }),
    phone_number: str({ value: t, key: 'phone_number' }),
    status: str({ value: t, key: 'status' }),
    is_owner: flag({ value: t, key: 'is_owner' }),
    reference_id: str({ value: t, key: 'reference_id' }),
    assignment_type: str({ value: assigned, key: 'assignment_type' }),
    location_ids: strings({ value: assigned, key: 'location_ids' }),
    created_at: str({ value: t, key: 'created_at' }),
    updated_at: str({ value: t, key: 'updated_at' }),
  };
}

function variation(v: unknown) {
  const data = rec({ value: v, key: 'item_variation_data' });
  const price = money({ value: data, key: 'price_money' });
  return {
    id: str({ value: v, key: 'id' }),
    item_id: str({ value: data, key: 'item_id' }),
    name: str({ value: data, key: 'name' }),
    sku: str({ value: data, key: 'sku' }),
    pricing_type: str({ value: data, key: 'pricing_type' }),
    price: price.amount,
    price_minor: price.minor,
    currency: price.currency,
    version: num({ value: v, key: 'version' }),
    is_deleted: flag({ value: v, key: 'is_deleted' }),
    updated_at: str({ value: v, key: 'updated_at' }),
  };
}

function catalogItem(o: unknown) {
  const data = rec({ value: o, key: 'item_data' });
  const variations = list({ value: data, key: 'variations' });
  const categories = list({ value: data, key: 'categories' }).map((c) => str({ value: c, key: 'id' })).filter((id): id is string => id !== null);
  const legacyCategory = str({ value: data, key: 'category_id' });
  return {
    id: str({ value: o, key: 'id' }),
    type: str({ value: o, key: 'type' }),
    name: str({ value: data, key: 'name' }),
    description: str({ value: data, key: 'description_plaintext' }) ?? str({ value: data, key: 'description' }),
    product_type: str({ value: data, key: 'product_type' }),
    category_ids: categories.length > 0 ? categories : legacyCategory ? [legacyCategory] : [],
    reporting_category_id: str({ value: rec({ value: data, key: 'reporting_category' }), key: 'id' }),
    is_archived: flag({ value: data, key: 'is_archived' }),
    is_deleted: flag({ value: o, key: 'is_deleted' }),
    present_at_all_locations: flag({ value: o, key: 'present_at_all_locations' }),
    version: num({ value: o, key: 'version' }),
    updated_at: str({ value: o, key: 'updated_at' }),
    variation_count: variations.length,
    variations_truncated: variations.length > MAX_VARIATIONS,
    variations: variations.slice(0, MAX_VARIATIONS).map(variation),
  };
}

function lineItem(li: unknown) {
  const base = money({ value: li, key: 'base_price_money' });
  const total = money({ value: li, key: 'total_money' });
  return {
    uid: str({ value: li, key: 'uid' }),
    name: str({ value: li, key: 'name' }),
    variation_name: str({ value: li, key: 'variation_name' }),
    catalog_object_id: str({ value: li, key: 'catalog_object_id' }),
    quantity: str({ value: li, key: 'quantity' }),
    note: str({ value: li, key: 'note' }),
    base_price: base.amount,
    total: total.amount,
    total_minor: total.minor,
  };
}

function order(o: unknown) {
  const items = list({ value: o, key: 'line_items' });
  const total = money({ value: o, key: 'total_money' });
  const due = money({ value: o, key: 'net_amount_due_money' });
  return {
    id: str({ value: o, key: 'id' }),
    location_id: str({ value: o, key: 'location_id' }),
    customer_id: str({ value: o, key: 'customer_id' }),
    reference_id: str({ value: o, key: 'reference_id' }),
    state: str({ value: o, key: 'state' }),
    version: num({ value: o, key: 'version' }),
    source_name: str({ value: rec({ value: o, key: 'source' }), key: 'name' }),
    ticket_name: str({ value: o, key: 'ticket_name' }),
    currency: total.currency,
    total: total.amount,
    total_minor: total.minor,
    total_tax: money({ value: o, key: 'total_tax_money' }).amount,
    total_discount: money({ value: o, key: 'total_discount_money' }).amount,
    total_tip: money({ value: o, key: 'total_tip_money' }).amount,
    total_service_charge: money({ value: o, key: 'total_service_charge_money' }).amount,
    net_amount_due: due.amount,
    payment_ids: list({ value: o, key: 'tenders' }).map((t) => str({ value: t, key: 'payment_id' }) ?? str({ value: t, key: 'id' })).filter((id): id is string => id !== null),
    fulfillment_states: list({ value: o, key: 'fulfillments' }).map((f) => str({ value: f, key: 'state' })).filter((s): s is string => s !== null),
    line_item_count: items.length,
    line_items_truncated: items.length > MAX_LINE_ITEMS,
    line_items: items.slice(0, MAX_LINE_ITEMS).map(lineItem),
    created_at: str({ value: o, key: 'created_at' }),
    updated_at: str({ value: o, key: 'updated_at' }),
    closed_at: str({ value: o, key: 'closed_at' }),
  };
}

function payment(p: unknown) {
  const amount = money({ value: p, key: 'amount_money' });
  const total = money({ value: p, key: 'total_money' });
  const card = rec({ value: rec({ value: p, key: 'card_details' }), key: 'card' });
  const external = rec({ value: p, key: 'external_details' });
  return {
    id: str({ value: p, key: 'id' }),
    status: str({ value: p, key: 'status' }),
    source_type: str({ value: p, key: 'source_type' }),
    location_id: str({ value: p, key: 'location_id' }),
    order_id: str({ value: p, key: 'order_id' }),
    customer_id: str({ value: p, key: 'customer_id' }),
    reference_id: str({ value: p, key: 'reference_id' }),
    note: str({ value: p, key: 'note' }),
    currency: total.currency ?? amount.currency,
    amount: amount.amount,
    amount_minor: amount.minor,
    tip: money({ value: p, key: 'tip_money' }).amount,
    total: total.amount,
    total_minor: total.minor,
    refunded: money({ value: p, key: 'refunded_money' }).amount,
    refunded_minor: money({ value: p, key: 'refunded_money' }).minor,
    card_brand: str({ value: card, key: 'card_brand' }),
    card_last_4: str({ value: card, key: 'last_4' }),
    card_entry_method: str({ value: rec({ value: p, key: 'card_details' }), key: 'entry_method' }),
    external_type: str({ value: external, key: 'type' }),
    external_source: str({ value: external, key: 'source' }),
    receipt_number: str({ value: p, key: 'receipt_number' }),
    receipt_url: str({ value: p, key: 'receipt_url' }),
    refund_ids: strings({ value: p, key: 'refund_ids' }),
    created_at: str({ value: p, key: 'created_at' }),
    updated_at: str({ value: p, key: 'updated_at' }),
  };
}

function refund(r: unknown) {
  const amount = money({ value: r, key: 'amount_money' });
  return {
    id: str({ value: r, key: 'id' }),
    status: str({ value: r, key: 'status' }),
    payment_id: str({ value: r, key: 'payment_id' }),
    order_id: str({ value: r, key: 'order_id' }),
    location_id: str({ value: r, key: 'location_id' }),
    reason: str({ value: r, key: 'reason' }),
    currency: amount.currency,
    amount: amount.amount,
    amount_minor: amount.minor,
    processing_fee: money({ value: list({ value: r, key: 'processing_fee' })[0], key: 'amount_money' }).amount,
    created_at: str({ value: r, key: 'created_at' }),
    updated_at: str({ value: r, key: 'updated_at' }),
  };
}

function inventoryCount(c: unknown) {
  return {
    variation_id: str({ value: c, key: 'catalog_object_id' }),
    object_type: str({ value: c, key: 'catalog_object_type' }),
    location_id: str({ value: c, key: 'location_id' }),
    state: str({ value: c, key: 'state' }),
    quantity: str({ value: c, key: 'quantity' }),
    calculated_at: str({ value: c, key: 'calculated_at' }),
  };
}

function paymentLink(l: unknown) {
  return {
    id: str({ value: l, key: 'id' }),
    version: num({ value: l, key: 'version' }),
    url: str({ value: l, key: 'url' }),
    long_url: str({ value: l, key: 'long_url' }),
    order_id: str({ value: l, key: 'order_id' }),
    description: str({ value: l, key: 'description' }),
    created_at: str({ value: l, key: 'created_at' }),
  };
}

function page<T>({ items, cursor }: { items: T[]; cursor: unknown }) {
  const next = typeof cursor === 'string' && cursor.length > 0 ? cursor : null;
  return { count: items.length, has_more: next !== null, next_cursor: next, items };
}

function requireObject({ body, key, what }: { body: unknown; key: string; what: string }): Record<string, unknown> {
  const inner = rec({ value: body, key: key });
  if (typeof inner['id'] !== 'string') {
    throw new Error(`Square returned an unexpected ${what} response.`);
  }
  return inner;
}

export const squareShape = {
  isRecord,
  rec,
  str,
  num,
  list,
  strings,
  money,
  customer,
  location,
  merchant,
  teamMember,
  catalogItem,
  variation,
  order,
  payment,
  refund,
  inventoryCount,
  paymentLink,
  page,
  requireObject,
  MAX_LINE_ITEMS,
};
