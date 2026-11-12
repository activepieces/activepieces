import { DEDUPE_KEY_PROPERTY } from '@activepieces/pieces-framework';
import { SallaAuth, sallaApi } from '../common/client';
import { sallaCustomers } from '../common/customers';
import { sallaMarketing } from '../common/marketing';
import { SallaWebhookEvent, sallaWebhooks } from '../common/webhooks';
import { sallaOrderTriggers } from './order-event-trigger';

export const sallaStoreTriggers = {
  enable: sallaOrderTriggers.enable,
  disable: sallaOrderTriggers.disable,
  receive: sallaOrderTriggers.receive,
  eventOutput,
  anyEventOutput,
  eventDedupeKey,
  ruleFor,
  requireCartEvent,
  requireAnyEvent,
  testCustomerOutputs,
  testCartOutputs,
  testReviewOutputs,
  customerSample,
  cartSample,
  reviewSample,
  anyEventSample,
};

function eventOutput({
  event,
  extras,
}: {
  event: SallaWebhookEvent;
  extras: (data: unknown) => Record<string, unknown>;
}): Record<string, unknown> {
  return {
    ...extras(event.data),
    salla_event: eventMeta(event),
    [DEDUPE_KEY_PROPERTY]: eventDedupeKey(event),
  };
}

function anyEventOutput(event: SallaWebhookEvent): Record<string, unknown> {
  return {
    event: event.event,
    store_id: event.merchant ?? null,
    created_at: event.createdAt ?? null,
    data: event.data,
    salla_event: eventMeta(event),
    [DEDUPE_KEY_PROPERTY]: eventDedupeKey(event),
  };
}

function eventDedupeKey(event: SallaWebhookEvent): string {
  if (event.event !== REVIEW_ADDED_EVENT || idText(event.data['id']) !== undefined) {
    return sallaWebhooks.dedupeKey(event);
  }
  const customerId = idText(nestedId({ record: event.data, key: 'customer' })) ?? '';
  const productId = idText(nestedId({ record: event.data, key: 'product' })) ?? '';
  const orderId = idText(nestedId({ record: event.data, key: 'order' })) ?? '';
  return `${event.event}:${customerId}:${productId}:${orderId}:${event.createdAt ?? ''}:${sallaWebhooks.contentDigest(event.data)}`;
}

function ruleFor({ event, rule }: { event: string; rule: string | undefined | null }): string | undefined {
  const trimmed = typeof rule === 'string' ? rule.trim() : '';
  if (trimmed.length === 0) {
    return undefined;
  }
  if (!RULE_CAPABLE_EVENTS.has(event)) {
    throw new Error(
      `Salla does not support a filter rule on the ${event} event. Clear Salla Filter Rule, or pick an order, customer, special offer, category, brand, abandoned cart (created or changed), review, or product created/deleted/low stock event.`,
    );
  }
  return trimmed;
}

function requireCartEvent(value: unknown): CartEvent {
  const match = CART_EVENTS.find((event) => event === value);
  if (!match) {
    throw new Error(`"${String(value ?? '')}" is not a supported cart event. Pick "Cart abandoned or changed" or "Cart recovered (purchased)".`);
  }
  return match;
}

function requireAnyEvent(value: unknown): string {
  const event = typeof value === 'string' ? value.trim() : '';
  if (event.length === 0) {
    throw new Error('Pick the Salla event that should start the flow.');
  }
  if (DEPRECATED_EVENTS.includes(event)) {
    throw new Error(
      `Salla has retired the ${event} event and no longer sends it, even though it may still show in the list. Use the Product Price or Status Changed trigger instead.`,
    );
  }
  return event;
}

async function testCustomerOutputs({ auth, event }: { auth: SallaAuth; event: string }): Promise<Record<string, unknown>[]> {
  const { customers } = await sallaCustomers.listCustomers({ auth, filters: { maxResults: TEST_RECORD_COUNT } });
  return customers.map((customer) => ({ ...customer, salla_event: testEventMeta(event) }));
}

async function testCartOutputs({ auth, event }: { auth: SallaAuth; event: CartEvent }): Promise<Record<string, unknown>[]> {
  if (event === CART_PURCHASED_EVENT) {
    return [cartSample({ event })];
  }
  const { carts } = await sallaMarketing.listAbandonedCarts({ auth, filters: { maxResults: TEST_RECORD_COUNT } });
  return carts.map((cart) => ({ ...cart, salla_event: testEventMeta(event) }));
}

async function testReviewOutputs({ auth }: { auth: SallaAuth }): Promise<Record<string, unknown>[]> {
  const { items } = await sallaApi.fetchPaged<unknown>({
    auth,
    path: '/reviews',
    maxItems: TEST_RECORD_COUNT,
    perPage: TEST_RECORD_COUNT,
    maxPages: 1,
  });
  return items.filter(sallaApi.isRecord).map((review) => ({
    ...sallaMarketing.withReviewExtras(listedReviewPayload(review)),
    salla_event: testEventMeta(REVIEW_ADDED_EVENT),
  }));
}

function listedReviewPayload(review: Record<string, unknown>): Record<string, unknown> {
  const orderId = review['order_id'];
  return {
    ...review,
    order: sallaApi.isRecord(review['order']) ? review['order'] : { id: orderId ?? null },
  };
}

function customerSample({ event }: { event: string }): Record<string, unknown> {
  return {
    ...sallaCustomers.withCustomerExtras(SAMPLE_CUSTOMER),
    salla_event: sampleEventMeta(event),
  };
}

function cartSample({ event }: { event: CartEvent }): Record<string, unknown> {
  const data = event === CART_PURCHASED_EVENT ? SAMPLE_PURCHASED_CART : SAMPLE_CART;
  return {
    ...sallaMarketing.withCartExtras(data),
    salla_event: sampleEventMeta(event),
  };
}

function reviewSample(): Record<string, unknown> {
  return {
    ...sallaMarketing.withReviewExtras(SAMPLE_REVIEW),
    salla_event: sampleEventMeta(REVIEW_ADDED_EVENT),
  };
}

function anyEventSample(): Record<string, unknown> {
  return {
    event: SAMPLE_ANY_EVENT,
    store_id: SAMPLE_STORE_ID,
    created_at: SAMPLE_SENT_AT,
    data: SAMPLE_BRAND,
    salla_event: sampleEventMeta(SAMPLE_ANY_EVENT),
  };
}

function nestedId({ record, key }: { record: Record<string, unknown>; key: string }): unknown {
  const nested = record[key];
  return sallaApi.isRecord(nested) ? nested['id'] : undefined;
}

function idText(value: unknown): string | undefined {
  if (typeof value === 'number') {
    return String(value);
  }
  if (typeof value === 'string' && value.trim().length > 0) {
    return value.trim();
  }
  return undefined;
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

function sampleEventMeta(event: string): SallaEventMeta {
  return { name: event, store_id: SAMPLE_STORE_ID, created_at: SAMPLE_SENT_AT };
}

const TEST_RECORD_COUNT = 3;
const CART_ABANDONED_EVENT = 'abandoned.cart';
const CART_PURCHASED_EVENT = 'abandoned.cart.purchased';
const CART_PURCHASED_STATUS = 'purchased';
const REVIEW_ADDED_EVENT = 'review.added';
const CART_EVENTS: CartEvent[] = [CART_ABANDONED_EVENT, CART_PURCHASED_EVENT];
const DEPRECATED_EVENTS = ['product.updated', 'product.available'];
const SAMPLE_ANY_EVENT = 'brand.created';
const SAMPLE_STORE_ID = 1305146709;
const SAMPLE_SENT_AT = 'Tue Nov 10 2026 12:36:49 GMT+0300';

const RULE_CAPABLE_EVENTS = new Set<string>([
  'order.created',
  'order.updated',
  'order.status.updated',
  'order.cancelled',
  'order.refunded',
  'order.deleted',
  'order.products.updated',
  'order.payment.updated',
  'order.coupon.updated',
  'order.total.price.updated',
  'order.shipment.creating',
  'order.shipment.created',
  'order.shipment.cancelled',
  'order.shipment.return.creating',
  'order.shipment.return.created',
  'order.shipment.return.cancelled',
  'order.shipping.address.updated',
  'product.created',
  'product.deleted',
  'product.quantity.low',
  'customer.created',
  'customer.updated',
  'customer.login',
  'customer.otp.request',
  'specialoffer.created',
  'specialoffer.updated',
  'category.created',
  'category.updated',
  'brand.created',
  'brand.updated',
  'brand.deleted',
  CART_ABANDONED_EVENT,
  REVIEW_ADDED_EVENT,
]);

const SAMPLE_CUSTOMER: Record<string, unknown> = {
  id: 225167971,
  first_name: 'Sara',
  last_name: 'Mohammed',
  mobile: 555555555,
  mobile_code: '+966',
  email: 'sara.mohammed@example.com',
  urls: {
    customer: 'https://salla.sa/dev-wofftr4xsra5xtlv/profile',
    admin: 'https://s.salla.sa/customers/l7mYBdgXA9xJwWZRZK8WD42GNkZbjvRO',
  },
  avatar: 'https://i.ibb.co/jyqRQfQ/avatar-male.webp',
  gender: 'female',
  birthday: { date: '1997-06-03 00:00:00.000000', timezone_type: 3, timezone: 'Asia/Riyadh' },
  city: 'Riyadh',
  country: 'Saudi Arabia',
  country_code: 'SA',
  currency: 'SAR',
  location: '14',
  updated_at: { date: '2026-11-10 12:36:45.000000', timezone_type: 3, timezone: 'Asia/Riyadh' },
  groups: [],
  source: { device: 'desktop', 'user-agent': 'Mozilla/5.0', ip: '127.0.0.1' },
  is_notifications_enabled: true,
};

const SAMPLE_CART: Record<string, unknown> = {
  id: 1097962121,
  total: { amount: 100, currency: 'SAR' },
  subtotal: { amount: 110, currency: 'SAR' },
  total_discount: { amount: 10, currency: 'SAR' },
  checkout_url: 'https://salla.sa/dev-wofftr4xsra5xtlv/checkout/1097962121',
  age_in_minutes: 83,
  created_at: { date: '2026-11-10 11:13:39.000000', timezone_type: 3, timezone: 'Asia/Riyadh' },
  updated_at: { date: '2026-11-10 11:13:39.000000', timezone_type: 3, timezone: 'Asia/Riyadh' },
  status: 'active',
  customer: {
    id: 225167971,
    name: 'Sara Mohammed',
    mobile: '+966555555555',
    email: 'sara.mohammed@example.com',
    avatar: 'https://i.ibb.co/jyqRQfQ/avatar-male.webp',
    country: 'Saudi Arabia',
    city: 'Riyadh',
  },
  coupon: {
    id: 2036833834,
    code: 'WELCOME20',
    status: 'active',
    type: 'percentage',
    amount: 20,
    minimum_amount: 0,
    expiry_date: '2026-12-31 00:00:00',
    start_date: null,
    created_at: 'Tue Nov 10 2026 11:00:00 GMT+0300',
    free_shipping: true,
  },
  items: [
    { id: 1793843311, product_id: 401511871, quantity: 2 },
    { id: 239847784, product_id: 64738276, quantity: 1 },
  ],
};

const SAMPLE_PURCHASED_CART: Record<string, unknown> = {
  id: 1305879817,
  status: CART_PURCHASED_STATUS,
  currency: 'SAR',
  total: 34.99,
  subtotal: 30.43,
  total_discount: 0,
};

const SAMPLE_REVIEW: Record<string, unknown> = {
  type: 'rating',
  rating: '5',
  content: 'Great quality, fast delivery.',
  customer: {
    id: '2107468057',
    name: 'Mohammed Ali',
    mobile: '+966501806978',
    avatar: 'https://i.ibb.co/jyqRQfQ/avatar-male.webp',
    country: 'Saudi Arabia',
    city: 'Riyadh',
  },
  product: {
    id: '1653503260',
    type: 'product',
    promotion: { title: null, sub_title: null },
  },
  status: {
    id: '1298199463',
    name: 'Completed',
    customized: { id: '1693817923', name: 'Completed' },
    can_cancel: false,
  },
  is_available: true,
  sku: 'TSHIRT-RED-M',
  name: 'Classic Cotton T-Shirt',
  price: { amount: 299, currency: 'SAR' },
  sale_price: { amount: '0', currency: 'SAR' },
  currency: 'SAR',
  url: 'https://salla.sa/dev-wofftr4xsra5xtlv/classic-cotton-t-shirt/p1653503260',
  thumbnail: null,
  has_special_price: false,
  regular_price: { amount: '299', currency: 'SAR' },
  favorite: null,
  order: {
    id: '1289663293',
    reference_id: '27290',
    total: { amount: '314', currency: 'SAR' },
  },
  date: ['2026-11-10'],
  items: [{ name: 'Classic Cotton T-Shirt', quantity: '1' }],
};

const SAMPLE_BRAND: Record<string, unknown> = {
  id: 1473353380,
  name: 'Nike',
  description: 'Sportswear and shoes.',
  banner: null,
  logo: null,
  status: 'active',
  ar_char: 'ن',
  en_char: 'N',
  metadata: { title: null, description: null, url: null },
};

const CUSTOMER_RULE_DESCRIPTION =
  'Optional condition Salla checks before sending the event, so the flow only runs for matching customers. Put text values in backticks, written in the store language, which is Arabic by default. Examples: ``gender = `female` `` or ``city = `الرياض` ``. Customer fields you can use include id, first_name, last_name, mobile, mobile_code, email, gender, city, country and currency.';

const CART_RULE_DESCRIPTION =
  'Optional condition Salla checks before sending the event, so the flow only runs for matching carts. Works only with "Cart abandoned or changed"; Salla does not filter recovered carts. Put text values in backticks. Examples: `total > 200` or ``coupon_code = `WELCOME20` ``. Cart fields you can use include id, total, subtotal, currency, coupon_code, customer_id, customer_name and customer_mobile.';

const REVIEW_RULE_DESCRIPTION =
  'Optional condition Salla checks before sending the event, so the flow only runs for matching reviews. Put text values in backticks. Examples: `rating < 3` or ``product_id = 1653503260 AND type = `rating` ``. Review fields you can use include product_id, rating, customer_id, order_id, content and type.';

const ANY_EVENT_RULE_DESCRIPTION =
  'Optional condition Salla checks before sending the event, so the flow only runs for matching records. Put text values in backticks, for example `total > 100` or ``status = `active` ``. The fields depend on the event. Salla supports rules only on order, customer, special offer, category, brand, abandoned cart and review events, plus product created, deleted and low stock; leave this empty for any other event.';

type CartEvent = 'abandoned.cart' | 'abandoned.cart.purchased';

type SallaEventMeta = {
  name: string;
  store_id: number | string | null;
  created_at: string | null;
};

export {
  CART_ABANDONED_EVENT,
  CART_PURCHASED_EVENT,
  REVIEW_ADDED_EVENT,
  CUSTOMER_RULE_DESCRIPTION,
  CART_RULE_DESCRIPTION,
  REVIEW_RULE_DESCRIPTION,
  ANY_EVENT_RULE_DESCRIPTION,
};
export type { CartEvent };
