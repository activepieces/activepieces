import { createAction, Property } from '@activepieces/pieces-framework';
import { qawafelAuth } from '../common/auth';
import { qawafelPaginatedList } from '../common/client';
import { qawafelProps } from '../common/props';

const ORDER_STATES: { label: string; value: string }[] = [
  { label: 'Pending vendor confirmation', value: 'pending_vendor_confirmation' },
  { label: 'Pending customer confirmation', value: 'pending_customer_confirmation' },
  { label: 'Confirmed', value: 'confirmed' },
  { label: 'Ready for pickup', value: 'ready_for_pickup' },
  { label: 'Picked up by courier', value: 'picked_up_by_courier' },
  { label: 'Received in warehouse', value: 'received_in_warehouse' },
  { label: 'Under fulfillment', value: 'under_fulfillment' },
  { label: 'Ready to dispatch', value: 'ready_to_dispatch' },
  { label: 'Out for delivery', value: 'out_for_delivery' },
  { label: 'Delivered', value: 'delivered' },
  { label: 'Not delivered', value: 'not_delivered' },
  { label: 'Fulfilled', value: 'fulfilled' },
  { label: 'Cancelled by vendor', value: 'cancelled_by_vendor' },
  { label: 'Cancelled by admin', value: 'cancelled_by_admin' },
  { label: 'Cancelled by customer', value: 'cancelled_by_customer' },
];

export const listOrders = createAction({
  auth: qawafelAuth,
  name: 'list_orders',
  displayName: 'List Orders',
  description:
    'Get orders, optionally filtered by status, customer, or creation date. Returns up to 500 orders (5 pages of 100).',
  props: {
    state: Property.StaticDropdown<string>({
      displayName: 'Status (filter)',
      description:
        'Optional. Return only orders in this state. Leave blank for all statuses.',
      required: false,
      options: {
        disabled: false,
        options: ORDER_STATES,
      },
    }),
    merchant_id: qawafelProps.merchantDropdown({
      displayName: 'Customer (filter)',
      description:
        'Optional. Return only orders from this customer. Leave blank for all customers.',
      required: false,
      type: 'customer',
    }),
    created_after: Property.DateTime({
      displayName: 'Created After',
      description:
        'Optional. Return only orders created after this date and time.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const queryParams=new URLSearchParams();

    if (propsValue.state) {
      queryParams.append('state', propsValue.state);
    }
    if (propsValue.merchant_id) {
      queryParams.append('merchant_id', propsValue.merchant_id);
    }
    if (propsValue.created_after) {
      queryParams.append('created_after', propsValue.created_after);
    }

    const data = await qawafelPaginatedList({
      auth,
      path: `/orders?${queryParams.toString()}`,
    });
    return { count: data.length, data };
  },
});
