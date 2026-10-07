import { HttpMethod } from '@activepieces/pieces-common';
import { Property, TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { squareAuth } from '../auth';
import { squareClient, SquareApiError, SquareAuth } from '../common/client';
import { squareProps } from '../common/props';
import { squareShape } from '../common/shape';
import { squareOutputSchemas } from '../output-schemas';
import { squareSamples } from './samples';

const DEDUPE_STORE_KEY = 'square_recent_event_ids';
const DEDUPE_WINDOW_MS = 15 * 60 * 1000;
const DEDUPE_MAX_ENTRIES = 500;

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
      if (await isDuplicate({ store: context.store, eventId: squareShape.str({ value: body, key: 'event_id' }) })) {
        return [];
      }
      if (trigger.orderSummary && context.propsValue['include_full_order'] === true) {
        const orderId = squareShape.str({ value: squareShape.rec({ value: body, key: 'data' }), key: 'id' });
        if (!orderId) {
          return [body];
        }
        const order = await fetchOrder({ auth: context.auth, orderId });
        return order === null ? [] : [{ ...body, order }];
      }
      return [body];
    },
  }),
);

async function isDuplicate({ store, eventId }: { store: DedupeStore; eventId: string | null }): Promise<boolean> {
  if (!eventId) {
    return false;
  }
  const now = Date.now();
  const stored = await store.get<unknown>(DEDUPE_STORE_KEY);
  const recent = (Array.isArray(stored) ? stored : []).filter(
    (entry): entry is SeenEvent => squareShape.isRecord(entry) && typeof entry['id'] === 'string' && typeof entry['at'] === 'number' && now - entry['at'] < DEDUPE_WINDOW_MS,
  );
  if (recent.some((entry) => entry.id === eventId)) {
    return true;
  }
  await store.put(DEDUPE_STORE_KEY, [...recent.slice(-(DEDUPE_MAX_ENTRIES - 1)), { id: eventId, at: now }]);
  return false;
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

type SeenEvent = { id: string; at: number };

type DedupeStore = {
  get: <T>(key: string) => Promise<T | null>;
  put: <T>(key: string, value: T) => Promise<T>;
};
