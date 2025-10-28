import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { bigcommerceAuth } from '../common/auth';
import { sendBigCommerceRequest, handleBigCommerceError } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const shipmentCreated = createTrigger({
  auth: bigcommerceAuth,
  name: 'shipment_created',
  displayName: 'Shipment Created',
  description: 'Triggers when a new shipment is created via BigCommerce webhook (monitors order updates for shipments)',
  type: TriggerStrategy.WEBHOOK,
  props: {},
  sampleData: {
    scope: 'store/order/updated',
    store_id: '1025646',
    data: {
      type: 'order',
      id: 250,
      orderId: 250,
    },
    hash: 'a8b4e3e3e3e3e3e3e3e3e3e3e3e3e3e3e3e3e3e3',
    created_at: 1561479335,
    producer: 'stores/abcde',
    shipment_data: {
      id: 123,
      order_id: 250,
      tracking_number: 'TRK123456789',
      shipping_method: 'UPS Ground',
    },
  },
  async onEnable(context) {
    const webhookUrl = context.webhookUrl;
    
    try {
      // Create webhook for order updated events (to detect new shipments)
      const webhook = await sendBigCommerceRequest({
        auth: context.auth,
        url: '/hooks',
        method: HttpMethod.POST,
        body: {
          scope: 'store/order/updated',
          destination: webhookUrl,
          is_active: true,
          headers: {},
        },
      });

      const webhookData = (webhook.body as { data: any }).data;
      await context.store?.put('webhookId', webhookData.id.toString());
      await context.store?.put('knownShipments', JSON.stringify([]));
      
      console.log(`BigCommerce webhook created with ID: ${webhookData.id}`);
    } catch (error) {
      console.error('Failed to create BigCommerce webhook:', error);
      throw handleBigCommerceError(error, 'Failed to create webhook for shipment detection');
    }
  },
  
  async onDisable(context) {
    const webhookId = await context.store?.get('webhookId');
    
    if (webhookId) {
      try {
        await sendBigCommerceRequest({
          auth: context.auth,
          url: `/hooks/${webhookId}`,
          method: HttpMethod.DELETE,
        });
        
        await context.store?.delete('webhookId');
        await context.store?.delete('knownShipments');
        console.log(`BigCommerce webhook ${webhookId} deleted`);
      } catch (error) {
        console.error('Failed to delete BigCommerce webhook:', error);
      }
    }
  },
  
  async run(context) {
    const payload = context.payload.body as any;
    
    // Validate webhook payload
    if (!payload || payload.scope !== 'store/order/updated') {
      return [];
    }

    try {
      const orderId = payload.data?.id || payload.data?.orderId;
      
      if (!orderId) {
        console.error('No order ID found in webhook payload');
        return [];
      }

      // Check for new shipments on this order
      const shipmentsResponse = await sendBigCommerceRequest({
        auth: context.auth,
        url: `/orders/${orderId}/shipments`,
        method: HttpMethod.GET,
      });

      const shipments = (shipmentsResponse.body as { data: any[] }).data || [];
      
      if (shipments.length === 0) {
        return [];
      }

      // Get known shipments from storage
      const knownShipmentsStr = await context.store?.get('knownShipments') as string;
      const knownShipments = knownShipmentsStr ? JSON.parse(knownShipmentsStr) : [];
      const knownShipmentIds = new Set(knownShipments.map((s: any) => s.id));

      // Find new shipments
      const newShipments = shipments.filter(shipment => !knownShipmentIds.has(shipment.id));

      if (newShipments.length > 0) {
        // Update known shipments
        const allKnownShipments = [...knownShipments, ...newShipments];
        await context.store?.put('knownShipments', JSON.stringify(allKnownShipments.slice(-1000)));

        // Get order details for context
        const orderResponse = await sendBigCommerceRequest({
          auth: context.auth,
          url: `/orders/${orderId}`,
          method: HttpMethod.GET,
        });

        const order = (orderResponse.body as { data: any }).data;

        return newShipments.map(shipment => ({
          ...shipment,
          order_id: orderId,
          customer_id: order.customer_id,
          webhook_payload: payload,
          triggered_at: new Date().toISOString(),
        }));
      }

      return [];
    } catch (error) {
      console.error('Error processing shipment webhook:', error);
      return [];
    }
  },
});