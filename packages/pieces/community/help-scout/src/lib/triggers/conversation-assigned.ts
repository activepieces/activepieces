import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { helpScoutAuth } from '../common/auth';

const WEBHOOK_KEY = 'helpscout_conversation_assigned_webhook_id';

export const conversationAssigned = createTrigger({
  auth: helpScoutAuth,
  name: 'conversation_assigned',
  displayName: 'Conversation Assigned',
  description: 'Fires when a conversation is assigned to a user.',
  type: TriggerStrategy.WEBHOOK,
  props: {},
  sampleData: {
    id: 123456,
    subject: 'Sample conversation',
    mailboxId: 1234,
    createdAt: '2024-01-01T00:00:00Z',
    status: 'active',
    assignedTo: 7890,
  },
  async onEnable(context: any) {
    const response = await fetch('https://api.helpscout.net/v2/webhooks', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${context.auth.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: context.webhookUrl,
        events: ['convo.assigned'],
      }),
    });
    if (!response.ok) {
      throw new Error('Failed to register Help Scout webhook');
    }
    const data = await response.json();
    await context.store.put(WEBHOOK_KEY, data.id);
  },
  async onDisable(context: any) {
    const webhookId = await context.store.get(WEBHOOK_KEY);
    if (webhookId) {
      await fetch(`https://api.helpscout.net/v2/webhooks/${webhookId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${context.auth.access_token}`,
        },
      });
      await context.store.delete(WEBHOOK_KEY);
    }
  },
  async run(context: any): Promise<any[]> {
    return [context.payload.body];
  },
}); 