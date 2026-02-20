import { createOroWebhookTrigger } from '../common/register-webhook';
import { orderCreateData, orderUpdateData, orderDeleteData } from '../examples/order';

export const newOrder = createOroWebhookTrigger({
  name: 'new_order',
  description: 'Triggered when a new order is created',
  topic: 'order',
  event: 'create',
  displayName: 'New Order',
  sampleData: orderCreateData,
});

export const updatedOrder = createOroWebhookTrigger({
  name: 'updated_order',
  description: 'Triggered when an order is updated',
  topic: 'order',
  event: 'update',
  displayName: 'Order Update',
  sampleData: orderUpdateData,
});

export const removedOrder = createOroWebhookTrigger({
  name: 'removed_order',
  description: 'Triggered when an order is deleted',
  topic: 'order',
  event: 'delete',
  displayName: 'Order Removal',
  sampleData: orderDeleteData,
});
