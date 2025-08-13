import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { xeroAuth } from '../..';
import { props } from '../common/props';

export const newSalesInvoice = createTrigger({
  auth: xeroAuth,
  name: 'newSalesInvoice',
  displayName: 'New Sales Invoice',
  description: 'Fires when a new sales invoice (Accounts Receivable) is created in Xero',
  props: {
    tenant_id: props.tenant_id,
  },
  sampleData: {
    resourceUrl: 'https://api.xero.com/api.xro/2.0/Invoices/12345678-1234-1234-1234-123456789012',
    resourceId: '12345678-1234-1234-1234-123456789012',
    eventDateUtc: '2025-08-13T10:30:00.000Z',
    eventType: 'CREATE',
    eventCategory: 'INVOICE',
    tenantId: '12345678-1234-1234-1234-123456789012',
    tenantType: 'ORGANISATION',
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    const webhookUrl = context.webhookUrl;
    const tenantId = context.propsValue.tenant_id;

    // Create webhook subscription in Xero
    const webhookPayload = {
      deliveryUrl: webhookUrl,
      intentToPay: 'https://example.com/intent-to-pay', // Required by Xero
    };

    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.PUT,
        url: 'https://api.xero.com/api.xro/2.0/Webhooks',
        headers: {
          'Authorization': `Bearer ${context.auth.access_token}`,
          'Xero-Tenant-Id': tenantId,
          'Content-Type': 'application/json',
        },
        body: webhookPayload,
      });

      // Store the webhook ID for later deletion
      const webhookId = response.body?.webhooks?.[0]?.webhookId;
      await context.store?.put('webhookId', webhookId);
      
      console.log('Webhook created successfully:', webhookId);
    } catch (error) {
      console.error('Failed to create webhook:', error);
      throw new Error(`Failed to create webhook: ${error}`);
    }
  },
  async onDisable(context) {
    const webhookId = await context.store?.get('webhookId');
    const tenantId = context.propsValue.tenant_id;

    if (webhookId) {
      try {
        await httpClient.sendRequest({
          method: HttpMethod.DELETE,
          url: `https://api.xero.com/api.xro/2.0/Webhooks/${webhookId}`,
          headers: {
            'Authorization': `Bearer ${context.auth.access_token}`,
            'Xero-Tenant-Id': tenantId,
          },
        });
        
        console.log('Webhook deleted successfully:', webhookId);
      } catch (error) {
        console.error('Failed to delete webhook:', error);
      }
    }
  },
  async run(context) {
    const payload = context.payload.body as any;
    
  
    if (payload.events) {
      const salesInvoiceEvents = payload.events.filter((event: any) => 
        event.eventCategory === 'INVOICE' && 
        event.eventType === 'CREATE'
      );
      
      if (salesInvoiceEvents.length > 0) {
        return salesInvoiceEvents;
      }
    }
    
    return [];
  },
});