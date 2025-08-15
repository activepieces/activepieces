import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { mollieAuth } from '../common/common';
import { MollieApi } from '../common/common';

export const newOrderTrigger = createTrigger({
  auth: mollieAuth,
  name: 'new_order',
  displayName: 'New Order',
  description: 'Fires when a new order is created',
  props: {},
  sampleData: {
    resource: 'order',
    id: 'ord_pbjz8x',
    profileId: 'pfl_QkEhN94Ba',
    mode: 'live',
    amount: {
      value: '1027.99',
      currency: 'EUR'
    },
    status: 'created',
    isCancelable: true,
    metadata: {},
    createdAt: '2018-08-02T09:29:56+00:00',
    expiresAt: '2018-08-30T09:29:56+00:00',
    orderNumber: '18475',
    _links: {
      self: {
        href: 'https://api.mollie.com/v2/orders/ord_pbjz8x',
        type: 'application/hal+json'
      }
    }
  },
  type: TriggerStrategy.POLLING,
  async onEnable(context) {
    await context.store?.put('lastChecked', new Date().toISOString());
  },
  async onDisable(context) {
    await context.store?.delete('lastChecked');
  },
    async run(context) {
    const api = new MollieApi({ accessToken: context.auth.access_token });
    
    try {
      // Handle lastChecked properly - fix the type issue
      const storedLastChecked = await context.store?.get('lastChecked');
      const lastChecked = typeof storedLastChecked === 'string' 
        ? storedLastChecked 
        : new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      
      const response = await api.searchOrders({
        limit: 250
      });
      
      // Handle unknown response type safely with type guards
      const orders = (
        response && 
        typeof response === 'object' && 
        '_embedded' in response &&
        response._embedded &&
        typeof response._embedded === 'object' &&
        'orders' in response._embedded &&
        Array.isArray(response._embedded.orders)
      ) ? response._embedded.orders : [];
      
      const newOrders = orders.filter((order: any) => 
        order.createdAt && new Date(order.createdAt) > new Date(lastChecked)
      );
      
      if (orders.length > 0) {
        const latest = orders.reduce((prev: any, current: any) => 
          new Date(current.createdAt) > new Date(prev.createdAt) ? current : prev
        );
        await context.store?.put('lastChecked', latest.createdAt);
      }
      
      return newOrders;
    } catch (error) {
      console.error('Error fetching orders:', error);
      return [];
    }
  },
});