import { HttpMethod } from '@activepieces/pieces-common';
import {
  Property,
  TriggerStrategy,
  createTrigger,
} from '@activepieces/pieces-framework';
import { qawafelAuth } from '../common/auth';
import { qawafelApiCall } from '../common/client';

const ORDER_STATUS_EVENTS: { label: string; value: OrderStatusEvent }[] = [
  { label: 'Confirmed (vendor accepted the order)', value: 'order.confirmed' },
  { label: 'Ready for Pickup', value: 'order.ready_for_pickup' },
  { label: 'Out for Delivery', value: 'order.out_for_delivery' },
  { label: 'Delivered', value: 'order.delivered' },
  { label: 'Not Delivered (failed delivery)', value: 'order.not_delivered' },
  {
    label: 'Fulfilled (final state, payout released)',
    value: 'order.fulfilled',
  },
  { label: 'Cancelled', value: 'order.cancelled' },
];

export const orderStatusChanged = createTrigger({
  auth: qawafelAuth,
  name: 'order_status_changed',
  displayName: 'Order Status Changed',
  description:
    'Fires when an order moves to a specific status (confirmed, out for delivery, delivered, fulfilled, cancelled, etc.). Pick one status per trigger — add the trigger again for additional statuses.',
  type: TriggerStrategy.WEBHOOK,
  props: {
    status: Property.StaticDropdown<OrderStatusEvent>({
      displayName: 'Status to listen for',
      description:
        'The flow runs every time an order transitions into the status you pick here.',
      required: true,
      options: {
        disabled: false,
        options: ORDER_STATUS_EVENTS,
      },
    }),
  },
  sampleData: {
    id: 'whd_01jk5jtv3x7f6ijkgdxawvcejr',
    api_version: 'v1',
    timestamp: 1705312200,
    event: 'order.delivered',
    data: {
      id: 'ord_01jk5jtv3x6e5hjkfcwzvubejq',
      order_number: 'ORD-000123',
      merchant_id: 'mer_01jk5jtv3x2zbdroz75n3eczi4',
      state: 'delivered',
      external_ref: null,
      created_at: '2026-04-27T10:15:00Z',
      updated_at: '2026-04-27T11:30:00Z',
    },
  },
  async onEnable(context) {
    const event = context.propsValue.status;
    const response = await qawafelApiCall<{ id: string }>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: '/webhooks',
      body: {
        url: context.webhookUrl,
        event,
        description: `Activepieces — order status ${event}`,
      },
    });
    await context.store.put(
      `qawafel_order_status_webhook_id_${context.propsValue.status}`,
      response.body.id
    );
  },
  async onDisable(context) {
    const webhookId = await context.store.get<string>(
      `qawafel_order_status_webhook_id_${context.propsValue.status}`
    );
    if (!webhookId) return;
    try {
      await qawafelApiCall({
        auth: context.auth,
        method: HttpMethod.DELETE,
        path: `/webhooks/${webhookId}`,
      });
    } catch {
      // Webhook may already be disabled — ignore.
    }
  },
  async run(context) {
    const payloadEvent = context.payload.body as { id: string; event: string };
    if (payloadEvent.event !== context.propsValue.status) {
      throw new Error(
        `Received event ${payloadEvent.event} does not match trigger configuration ${context.propsValue.status}`
      );
    }
    return [payloadEvent];
  },
});

type OrderStatusEvent =
  | 'order.confirmed'
  | 'order.ready_for_pickup'
  | 'order.out_for_delivery'
  | 'order.delivered'
  | 'order.not_delivered'
  | 'order.fulfilled'
  | 'order.cancelled';
