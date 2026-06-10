import { formitableRegisterTrigger } from './register-trigger';

export const orderOrdered = formitableRegisterTrigger({
  name: 'order_ordered',
  displayName: 'Order Placed',
  description: 'Triggers when a takeaway order is made or a gift voucher is purchased.',
  event: 'order.ordered',
  sampleData: {
    data: {
      order: {
        uid: 'order123',
        type: 'takeaway',
        total: 45.50,
        status: 'ordered',
      },
    },
    restaurantUid: 'rest123',
    event: 'order.ordered',
  },
});
