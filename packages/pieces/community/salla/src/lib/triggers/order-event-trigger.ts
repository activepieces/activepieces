import { DEDUPE_KEY_PROPERTY, Store } from '@activepieces/pieces-framework';
import { SallaAuth, sallaApi } from '../common/client';
import { sallaUtils } from '../common/helpers';
import { sallaOrders } from '../common/orders';
import { SallaWebhookEvent, StoredSallaWebhook, sallaWebhooks } from '../common/webhooks';

export const sallaOrderTriggers = {
  enable,
  disable,
  receive,
  orderOutput,
  statusOutput,
  matchesStatuses,
  recentOrders,
  testOrderOutputs,
  testStatusOutputs,
  orderSample,
  statusSample,
};

async function enable({
  auth,
  store,
  storeKey,
  event,
  webhookUrl,
  rule,
}: {
  auth: SallaAuth;
  store: Store;
  storeKey: string;
  event: string;
  webhookUrl: string;
  rule: string | undefined;
}): Promise<void> {
  const stored = await sallaWebhooks.register({ auth, event, url: webhookUrl, rule });
  await store.put<StoredSallaWebhook>(storeKey, stored);
}

async function disable({ auth, store, storeKey }: { auth: SallaAuth; store: Store; storeKey: string }): Promise<void> {
  const stored = await store.get<StoredSallaWebhook>(storeKey);
  try {
    await sallaWebhooks.remove({ auth, webhookId: stored?.webhookId });
  } finally {
    await store.delete(storeKey);
  }
}

async function receive({
  store,
  storeKey,
  event,
  payload,
}: {
  store: Store;
  storeKey: string;
  event: string;
  payload: { headers?: Record<string, unknown>; body: unknown };
}): Promise<SallaWebhookEvent | undefined> {
  const stored = await store.get<StoredSallaWebhook>(storeKey);
  return sallaWebhooks.verifiedEvent({
    stored,
    headers: payload.headers,
    body: payload.body,
    expectedEvents: [event],
  });
}

function orderOutput(event: SallaWebhookEvent): Record<string, unknown> {
  return {
    ...sallaUtils.withOrderExtras(event.data),
    salla_event: eventMeta(event),
    [DEDUPE_KEY_PROPERTY]: sallaWebhooks.dedupeKey(event),
  };
}

function statusOutput(event: SallaWebhookEvent): Record<string, unknown> {
  return {
    ...statusEntry(event.data),
    salla_event: eventMeta(event),
    [DEDUPE_KEY_PROPERTY]: sallaWebhooks.dedupeKey(event),
  };
}

function matchesStatuses({ data, statuses }: { data: Record<string, unknown>; statuses: unknown }): boolean {
  const wanted = sallaUtils.toStringList(statuses);
  if (wanted.length === 0) {
    return true;
  }
  const order = data['order'];
  const orderStatus = sallaApi.isRecord(order) ? order['status'] : undefined;
  const candidates = [
    idOf(orderStatus),
    idOf(sallaApi.isRecord(orderStatus) ? orderStatus['customized'] : undefined),
    idOf(data['customized']),
  ].filter((id): id is string => id !== undefined);
  return candidates.some((id) => wanted.includes(id));
}

async function recentOrders({
  auth,
  statusIds,
}: {
  auth: SallaAuth;
  statusIds?: string[];
}): Promise<Record<string, unknown>[]> {
  const { orders } = await sallaOrders.listOrders({
    auth,
    filters: { maxResults: TEST_ORDER_COUNT, statusIds: statusIds && statusIds.length > 0 ? statusIds : undefined },
  });
  const ids = orders.map((order) => order['id']).filter((id) => typeof id === 'number' || typeof id === 'string');
  return Promise.all(ids.map((orderId) => sallaOrders.getOrder({ auth, orderId, includeItems: false })));
}

async function testOrderOutputs({ auth, event }: { auth: SallaAuth; event: string }): Promise<Record<string, unknown>[]> {
  const orders = await recentOrders({ auth });
  return orders.map((order) => ({ ...order, salla_event: testEventMeta(event) }));
}

async function testStatusOutputs({ auth, statuses }: { auth: SallaAuth; statuses: unknown }): Promise<Record<string, unknown>[]> {
  const orders = await recentOrders({ auth, statusIds: sallaUtils.toStringList(statuses) });
  return orders.map((order) => {
    const status = order['status'];
    const customized = sallaApi.isRecord(status) ? status['customized'] : undefined;
    const updatedAt = order['updated_at'] ?? order['date'];
    return {
      id: null,
      status: sallaApi.isRecord(status) && typeof status['name'] === 'string' ? status['name'] : null,
      status_slug: order['status_slug'] ?? null,
      note: null,
      customized: sallaApi.isRecord(customized) ? customized : null,
      created_at: updatedAt ?? null,
      created_at_iso: sallaUtils.toIsoDate(updatedAt) ?? null,
      order_id: order['id'] ?? null,
      order_reference_id: order['reference_id'] ?? null,
      order,
      salla_event: testEventMeta(ORDER_STATUS_UPDATED_EVENT),
    };
  });
}

function orderSample({ event }: { event: string }): Record<string, unknown> {
  return {
    ...sallaUtils.withOrderExtras({ ...SAMPLE_ORDER, status: SAMPLE_STATUS_BY_EVENT[event] ?? SAMPLE_ORDER['status'] }),
    salla_event: { name: event, store_id: SAMPLE_STORE_ID, created_at: SAMPLE_SENT_AT },
  };
}

function statusSample(): Record<string, unknown> {
  return {
    ...statusEntry(SAMPLE_STATUS_ENTRY),
    salla_event: { name: ORDER_STATUS_UPDATED_EVENT, store_id: SAMPLE_STORE_ID, created_at: SAMPLE_SENT_AT },
  };
}

function statusEntry(data: Record<string, unknown>): Record<string, unknown> {
  const order = sallaUtils.withOrderExtras(data['order']);
  return {
    id: data['id'] ?? null,
    status: data['status'] ?? null,
    status_slug: order['status_slug'] ?? null,
    note: data['note'] ?? null,
    customized: data['customized'] ?? null,
    created_at: data['created_at'] ?? null,
    created_at_iso: sallaUtils.toIsoDate(data['created_at']) ?? null,
    order_id: order['id'] ?? null,
    order_reference_id: order['reference_id'] ?? null,
    order,
  };
}

function eventMeta(event: SallaWebhookEvent): SallaEventMeta {
  return {
    name: event.event,
    store_id: event.merchant ?? null,
    created_at: event.createdAt ?? null,
  };
}

function testEventMeta(event: string): SallaEventMeta {
  return { name: event, store_id: null, created_at: null };
}

function idOf(value: unknown): string | undefined {
  if (!sallaApi.isRecord(value)) {
    return undefined;
  }
  const id = value['id'];
  return typeof id === 'number' || typeof id === 'string' ? String(id) : undefined;
}

const TEST_ORDER_COUNT = 3;
const ORDER_STATUS_UPDATED_EVENT = 'order.status.updated';
const SAMPLE_STORE_ID = 1305146709;
const SAMPLE_SENT_AT = 'Tue Nov 10 2026 12:21:48 GMT+0300';

const SAMPLE_CUSTOMER: Record<string, unknown> = {
  id: 225167971,
  first_name: 'Mohammed',
  last_name: 'Ali',
  full_name: 'Mohammed Ali',
  mobile: 501806978,
  mobile_code: '+966',
  email: 'mohammed.ali@example.com',
  city: 'Jeddah',
  country: 'Saudi Arabia',
  country_code: 'SA',
  currency: 'SAR',
};

const SAMPLE_AMOUNTS: Record<string, unknown> = {
  sub_total: { amount: 186, currency: 'SAR' },
  shipping_cost: { amount: 15, currency: 'SAR' },
  cash_on_delivery: { amount: 0, currency: 'SAR' },
  tax: { percent: '0.00', amount: { amount: 0, currency: 'SAR' } },
  discounts: [{ title: 'New offer', type: 'special', code: 'NEWOFFER', discount: '5.00', discounted_shipping: 0 }],
  total: { amount: 196, currency: 'SAR' },
};

const SAMPLE_ORDER: Record<string, unknown> = {
  id: 2116149737,
  reference_id: 41027662,
  urls: {
    customer: 'https://salla.sa/dev-wofftr4xsra5xtlv/order/DXZbOz68qjnYaOw04oBa35wVELBpJyxo',
    admin: 'https://s.salla.sa/orders/order/DXZbOz68qjnYaOw04oBa35wVELBpJyxo',
  },
  date: { date: '2026-11-10 12:21:45.000000', timezone_type: 3, timezone: 'Asia/Riyadh' },
  draft: false,
  read: true,
  source: 'store',
  source_device: 'desktop',
  status: {
    id: 566146469,
    name: 'Under Review',
    slug: 'under_review',
    customized: { id: 986688842, name: 'Under Review' },
  },
  payment_method: 'bank',
  payment_methods: [{ amount: 196, payment_method: 'bank', transaction_reference: null }],
  currency: 'SAR',
  amounts: SAMPLE_AMOUNTS,
  can_cancel: true,
  is_pending_payment: false,
  type: 'normal',
  customer: SAMPLE_CUSTOMER,
  tags: [],
};

const SAMPLE_STATUS_BY_EVENT: Record<string, Record<string, unknown>> = {
  'order.updated': { id: 1939592358, name: 'In Progress', slug: 'in_progress', customized: { id: 923207662, name: 'In Progress' } },
  'order.cancelled': { id: 525144736, name: 'Canceled', slug: 'canceled', customized: { id: 525144736, name: 'Canceled' } },
  'order.refunded': { id: 1956875584, name: 'Restored', slug: 'restored', customized: { id: 1956875584, name: 'Restored' } },
  'order.payment.updated': { id: 1939592358, name: 'In Progress', slug: 'in_progress', customized: { id: 923207662, name: 'In Progress' } },
};

const SAMPLE_STATUS_ENTRY: Record<string, unknown> = {
  id: 198290473,
  status: 'Completed',
  customized: null,
  note: 'The order details were sent to the customer by email',
  created_at: { date: '2026-11-10 23:59:38.000000', timezone_type: 3, timezone: 'Asia/Riyadh' },
  order: {
    ...SAMPLE_ORDER,
    id: 629263027,
    reference_id: 42264,
    payment_method: 'cod',
    payment_methods: [{ amount: 196, payment_method: 'cod', transaction_reference: null }],
    status: { id: 1298199463, name: 'Completed', slug: 'completed' },
    can_cancel: false,
  },
};

type SallaEventMeta = {
  name: string;
  store_id: number | string | null;
  created_at: string | null;
};
