import crypto from 'crypto';
import { HttpMethod } from '@activepieces/pieces-common';
import { DEDUPE_KEY_PROPERTY, Property, TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { squareAuth } from '../auth';
import { squareClient, SquareApiError, SquareAuth } from '../common/client';
import { squareProps } from '../common/props';
import { squareShape } from '../common/shape';
import { squareOutputSchemas } from '../output-schemas';
import { squareSamples } from './samples';

const DEDUPE_KEY_PREFIX = 'square_seen_events_';
const DEDUPE_SLOT_COUNT = 64;
const DEDUPE_WINDOW_MS = 15 * 60 * 1000;
const DEDUPE_CLAIM_TIMEOUT_MS = 2 * 60 * 1000;
const DEDUPE_MAX_PER_SLOT = 100;

const triggerData: TriggerDefinition[] = [
  {
    name: 'new_order',
    displayName: 'New Order',
    description: 'Triggered when a new order is created',
    aiMetadata: {
      description:
        'Fires when a new order is created in the Square seller account (order.created event). The payload is a summary (order id, location, state, version); turn on Include Full Order to also get line items and totals.',
    },
    event: 'order.created',
    objectKey: 'order_created',
    sampleData: squareSamples.new_order,
    orderSummary: true,
  },
  {
    name: 'order_updated',
    displayName: 'Order Updated',
    description: 'Triggered when an order is updated',
    aiMetadata: {
      description:
        'Fires when an existing order is modified in the Square seller account (order.updated event), for example a state change or a version bump. The payload is a summary; turn on Include Full Order to also get line items and totals.',
    },
    event: 'order.updated',
    objectKey: 'order_updated',
    sampleData: squareSamples.order_updated,
    orderSummary: true,
  },
  {
    name: 'new_customer',
    displayName: 'New Customer',
    description: 'Triggered when a customer is created',
    aiMetadata: {
      description:
        'Fires when a new customer profile is added to the Square Customer Directory (customer.created event). Represents a newly created customer record including contact details, address, creation source, and identifiers.',
    },
    event: 'customer.created',
    objectKey: 'customer',
    sampleData: squareSamples.new_customer,
    orderSummary: false,
  },
  {
    name: 'customer_updated',
    displayName: 'Customer Updated',
    description: 'Triggered when a customer is updated',
    aiMetadata: {
      description:
        'Fires when an existing customer profile is changed in the Square Customer Directory (customer.updated event). Represents an update to a customer record such as contact details or preferences, including the customer id and incremented version.',
    },
    event: 'customer.updated',
    objectKey: 'customer',
    sampleData: squareSamples.customer_updated,
    orderSummary: false,
  },

  {
    name: 'new_payment',
    displayName: 'New Payment',
    description: 'Triggered when a new payment is created',
    aiMetadata: {
      description:
        'Fires when a new payment is created in the Square seller account (payment.created event). Represents a payment taken against an order, including amounts, currency, card details, status, and the associated order and location.',
    },
    event: 'payment.created',
    objectKey: 'payment',
    sampleData: squareSamples.new_payment,
    orderSummary: false,
  },

];

export const triggers = triggerData.map((trigger) =>
  createTrigger({
    auth: squareAuth,
    name: trigger.name,
    classification: 'READ',
    displayName: trigger.displayName,
    description: trigger.description,
    aiMetadata: trigger.aiMetadata,
    props: trigger.orderSummary
      ? {
          location_id: squareProps.location({ required: false, description: 'Only fire for this location. Leave empty for all locations.' }),
          include_full_order: Property.Checkbox({
            displayName: 'Include Full Order',
            description: 'Also fetch the whole order (line items, totals, customer) and add it as "order" to the output.',
            required: false,
            defaultValue: false,
          }),
        }
      : trigger.objectKey === 'customer'
        ? {}
        : { location_id: squareProps.location({ required: false, description: 'Only fire for this location. Leave empty for all locations.' }) },
    type: TriggerStrategy.APP_WEBHOOK,
    sampleData: trigger.sampleData,
    outputSchema: squareOutputSchemas.triggers[trigger.name],
    onEnable: async (context) => {
      context.app.createListeners({
        events: [trigger.event],
        identifierValue: String(context.auth.data['merchant_id']),
      });
    },
    onDisable: async () => {
      return;
    },
    test: async (context) => {
      if (trigger.orderSummary && context.propsValue['include_full_order'] === true) {
        return [{ ...trigger.sampleData, order: squareShape.order(SAMPLE_ORDER) }];
      }
      return [trigger.sampleData];
    },
    run: async (context) => {
      const body = context.payload.body;
      if (!squareShape.isRecord(body)) {
        return [];
      }
      const locationFilter = context.propsValue['location_id'];
      if (typeof locationFilter === 'string' && locationFilter.length > 0) {
        const eventLocation = squareShape.str({ value: squareShape.rec({ value: squareShape.rec({ value: body, key: 'data' }), key: 'object' })[trigger.objectKey], key: 'location_id' }) ?? squareShape.str({ value: body, key: 'location_id' });
        if (eventLocation !== null && eventLocation !== locationFilter) {
          return [];
        }
      }
      const eventId = squareShape.str({ value: body, key: 'event_id' });
      const claim = await claimEvent({ store: context.store, eventId });
      if (claim === 'duplicate') {
        return [];
      }
      try {
        const events = await buildEvents({ trigger, body, auth: context.auth, includeFullOrder: context.propsValue['include_full_order'] === true });
        await finishClaim({ store: context.store, claim, succeeded: true });
        return withDedupeKey({ events, eventId });
      } catch (error) {
        await finishClaim({ store: context.store, claim, succeeded: false }).catch(() => undefined);
        throw error;
      }
    },
  }),
);

function withDedupeKey({ events, eventId }: { events: Record<string, unknown>[]; eventId: string | null }): Record<string, unknown>[] {
  if (!eventId) {
    return events;
  }
  return events.map((event) => ({ ...event, [DEDUPE_KEY_PROPERTY]: `square:${eventId}` }));
}

async function buildEvents({ trigger, body, auth, includeFullOrder }: { trigger: TriggerDefinition; body: Record<string, unknown>; auth: SquareAuth; includeFullOrder: boolean }): Promise<Record<string, unknown>[]> {
  if (!trigger.orderSummary || !includeFullOrder) {
    return [body];
  }
  const orderId = squareShape.str({ value: squareShape.rec({ value: body, key: 'data' }), key: 'id' });
  if (!orderId) {
    return [body];
  }
  const order = await fetchOrder({ auth, orderId });
  return order === null ? [] : [{ ...body, order }];
}

async function claimEvent({ store, eventId }: { store: DedupeStore; eventId: string | null }): Promise<Claim | 'duplicate'> {
  if (!eventId) {
    return null;
  }
  const key = slotKey({ eventId });
  const now = Date.now();
  const before = await readSlot({ store, key, now });
  if (before.some((entry) => entry.id === eventId && blocks({ entry, now }))) {
    return 'duplicate';
  }
  const token = crypto.randomUUID();
  const mine: SeenEvent = { id: eventId, at: now, token, done: false };
  await store.put(key, [...before.filter((entry) => entry.id !== eventId).slice(-(DEDUPE_MAX_PER_SLOT - 1)), mine]);
  const after = await readSlot({ store, key, now });
  const winner = after.find((entry) => entry.id === eventId);
  if (winner !== undefined && winner.token !== token) {
    return 'duplicate';
  }
  if (winner === undefined) {
    await store.put(key, [...after.slice(-(DEDUPE_MAX_PER_SLOT - 1)), mine]);
  }
  return { key, eventId, token };
}

async function finishClaim({ store, claim, succeeded }: { store: DedupeStore; claim: Claim; succeeded: boolean }): Promise<void> {
  if (claim === null) {
    return;
  }
  const now = Date.now();
  const entries = (await readSlot({ store, key: claim.key, now })).filter((entry) => entry.token !== claim.token);
  const updated = succeeded ? [...entries.filter((entry) => entry.id !== claim.eventId).slice(-(DEDUPE_MAX_PER_SLOT - 1)), { id: claim.eventId, at: now, token: claim.token, done: true }] : entries;
  await store.put(claim.key, updated);
}

async function readSlot({ store, key, now }: { store: DedupeStore; key: string; now: number }): Promise<SeenEvent[]> {
  const stored = await store.get<unknown>(key);
  return (Array.isArray(stored) ? stored : []).filter(
    (entry): entry is SeenEvent =>
      squareShape.isRecord(entry) &&
      typeof entry['id'] === 'string' &&
      typeof entry['at'] === 'number' &&
      typeof entry['token'] === 'string' &&
      typeof entry['done'] === 'boolean' &&
      now - entry['at'] < DEDUPE_WINDOW_MS,
  );
}

function blocks({ entry, now }: { entry: SeenEvent; now: number }): boolean {
  return entry.done || now - entry.at < DEDUPE_CLAIM_TIMEOUT_MS;
}

function slotKey({ eventId }: { eventId: string }): string {
  const slot = crypto.createHash('sha256').update(eventId).digest().readUInt32BE(0) % DEDUPE_SLOT_COUNT;
  return `${DEDUPE_KEY_PREFIX}${slot}`;
}

async function fetchOrder({ auth, orderId }: { auth: SquareAuth; orderId: string }) {
  try {
    const body = await squareClient.request<unknown>({ auth, method: HttpMethod.GET, path: ['v2', 'orders', orderId], operation: `read order "${orderId}"` });
    return squareShape.order(squareShape.requireObject({ body, key: 'order', what: 'order' }));
  } catch (error) {
    if (error instanceof SquareApiError && error.status === 404) {
      return null;
    }
    throw error;
  }
}

const SAMPLE_ORDER = {
  id: 'eA3vssLHKJrv9H0IdJCM3gNqfdcZY',
  location_id: 'FPYCBCHYMXFK1',
  state: 'OPEN',
  version: 1,
  customer_id: 'QPTXM8PQNX3Q726ZYHPMNP46XC',
  line_items: [
    {
      uid: 'k8ziVbfuGnF3vK9g0Tq9qC',
      name: 'Coffee',
      variation_name: 'Large',
      catalog_object_id: 'W62UWFY35CWMYGVWK6TWJDNI',
      quantity: '2',
      base_price_money: { amount: 450, currency: 'USD' },
      total_money: { amount: 900, currency: 'USD' },
    },
  ],
  total_money: { amount: 900, currency: 'USD' },
  total_tax_money: { amount: 0, currency: 'USD' },
  total_discount_money: { amount: 0, currency: 'USD' },
  total_tip_money: { amount: 0, currency: 'USD' },
  total_service_charge_money: { amount: 0, currency: 'USD' },
  net_amount_due_money: { amount: 900, currency: 'USD' },
  created_at: '2020-04-16T23:14:26.129Z',
  updated_at: '2020-04-16T23:14:26.129Z',
};

type TriggerDefinition = {
  name: string;
  displayName: string;
  description: string;
  aiMetadata: { description: string };
  event: string;
  objectKey: string;
  sampleData: Record<string, unknown>;
  orderSummary: boolean;
};

type SeenEvent = { id: string; at: number; token: string; done: boolean };

type Claim = { key: string; eventId: string; token: string } | null;

type DedupeStore = {
  get: <T>(key: string) => Promise<T | null>;
  put: <T>(key: string, value: T) => Promise<T>;
};
