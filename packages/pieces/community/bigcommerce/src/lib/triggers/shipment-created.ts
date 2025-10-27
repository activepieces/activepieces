import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { bigcommerceAuth } from '../common/auth';
import { sendBigCommerceRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const shipmentCreated = createTrigger({
  auth: bigcommerceAuth,
  name: 'shipment_created',
  displayName: 'Shipment Created',
  description: 'Triggers when a new shipment is created',
  type: TriggerStrategy.POLLING,
  props: {
    pollingInterval: Property.Number({
      displayName: 'Polling Interval (minutes)',
      description: 'How often to check for new shipments (minimum: 10 minutes)',
      required: false,
      defaultValue: 30,
    }),
  },
  sampleData: {
    id: 123,
    order_id: 456,
    customer_id: 789,
    order_address_id: 101,
    date_created: '2024-01-01T12:00:00Z',
    tracking_number: 'TRK123456789',
    shipping_method: 'UPS Ground',
    shipping_provider: 'UPS',
    tracking_carrier: 'ups',
    comments: 'Package shipped successfully',
    billing_address: {
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
    },
    shipping_address: {
      first_name: 'John',
      last_name: 'Doe',
      address1: '123 Main St',
      city: 'New York',
      state: 'NY',
      zip: '10001',
      country: 'United States',
    },
    items: [
      {
        order_product_id: 111,
        product_id: 222,
        quantity: 1,
      },
    ],
  },
  async onEnable(context) {
    const lastCheckTime = new Date().toISOString();
    await context.store?.put('lastCheckTime', lastCheckTime);
    await context.store?.put('knownShipments', JSON.stringify([]));
  },
  async onDisable(context) {
    await context.store?.delete('lastCheckTime');
    await context.store?.delete('knownShipments');
  },
  async run(context) {
    const { pollingInterval } = context.propsValue;
    const finalPollingInterval = Math.max(pollingInterval || 30, 10);

    try {
      const knownShipmentsStr = await context.store?.get('knownShipments') as string;
      const knownShipments = knownShipmentsStr ? JSON.parse(knownShipmentsStr) : [];
      const knownShipmentIds = new Set(knownShipments.map((shipment: any) => shipment.id));

      const ordersResponse = await sendBigCommerceRequest({
        auth: context.auth,
        url: '/orders',
        method: HttpMethod.GET,
        queryParams: { 
          limit: '50',
          sort: 'date_modified:desc',
        },
      });

      const orders = (ordersResponse.body as { data: any[] }).data || [];
      const newShipments: any[] = [];

      for (const order of orders.slice(0, 20)) {
        try {
          const shipmentsResponse = await sendBigCommerceRequest({
            auth: context.auth,
            url: `/orders/${order.id}/shipments`,
            method: HttpMethod.GET,
          });

          const shipments = (shipmentsResponse.body as { data: any[] }).data || [];
          
          for (const shipment of shipments) {
            if (!knownShipmentIds.has(shipment.id)) {
              newShipments.push({
                ...shipment,
                order_id: order.id,
                customer_id: order.customer_id,
                detectedAt: new Date().toISOString(),
              });
              knownShipmentIds.add(shipment.id);
            }
          }
        } catch (error) {
          console.error(`Error fetching shipments for order ${order.id}:`, error);
        }
      }

      const allKnownShipments = [...knownShipments, ...newShipments];
      await context.store?.put('knownShipments', JSON.stringify(allKnownShipments.slice(-1000)));
      await context.store?.put('lastCheckTime', new Date().toISOString());

      return newShipments;
    } catch (error) {
      console.error('Error polling for new shipments:', error);
      return [];
    }
  },
});