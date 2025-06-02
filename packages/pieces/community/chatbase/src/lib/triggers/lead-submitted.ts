import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { chatbaseAuth } from '../../index';
import { makeRequest } from '../common/index';
import { HttpMethod } from '@activepieces/pieces-common';

export const leadSubmittedTrigger = createTrigger({
  auth: chatbaseAuth,
  name: 'new_lead_submitted',
  displayName: 'New Lead Submitted',
  description: 'Triggers when a new lead is submitted via the chatbot.',
  type: TriggerStrategy.WEBHOOK,
  props: {},
  
  async onEnable(context) {
    const webhook = await makeRequest(
      context.auth,
      HttpMethod.POST,
      `/webhooks`,
      {
        endpoint: context.webhookUrl,
        events: ['leads.submit']
      }
    );
    
    await context.store.put('webhookId', webhook.id);
  },

  async onDisable(context) {
    const webhookId = await context.store.get('webhookId');
    
    if (webhookId) {
      await makeRequest(
        context.auth,
        HttpMethod.DELETE,
        `/webhooks/${webhookId}`
      );
    }
  },

  async run(context) {
    const payload = context.payload.body;
    return [payload];
  },

  sampleData: {
    eventType: 'leads.submit',
    chatbotId: 'xxxxxxxx',
    payload: {
      conversationId: 'xxxxxxxx',
      customerEmail: 'example@chatbase.co',
      customerName: 'Example',
      customerPhone: '123'
    }
  }
});
