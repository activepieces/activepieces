import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { xeroAuth } from '../..';
import { props } from '../common/props';

export const newOrUpdatedContact = createTrigger({
  auth: xeroAuth,
  name: 'newOrUpdatedContact',
  displayName: 'New or Updated Contact',
  description: 'Fires when a contact is created or updated in Xero',
  props: {
    tenant_id: props.tenant_id,
  },
  sampleData: {},
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
          Authorization: `Bearer ${context.auth.access_token}`,
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
            Authorization: `Bearer ${context.auth.access_token}`,
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
      const contactEvents = payload.events.filter(
        (event: any) =>
          event.eventCategory === 'CONTACT' &&
          (event.eventType === 'CREATE' || event.eventType === 'UPDATE')
      );

      if (contactEvents.length > 0) {
        return contactEvents;
      }
    }

    return [];
  },
});
