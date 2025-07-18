import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { helpScoutAuth } from '../common/auth';

const WEBHOOK_KEY = 'helpscout_tags_updated_webhook_id';

export const tagsUpdated = createTrigger({
  auth: helpScoutAuth,
  name: 'tags_updated',
  displayName: 'Tags Updated',
  description: 'Fires when tags on a conversation are modified.',
  type: TriggerStrategy.WEBHOOK,
  props: {},
  sampleData: {
    id: 123456,
    subject: 'Sample conversation',
    tags: ['support', 'urgent'],
    mailboxId: 1234,
    createdAt: '2024-01-01T00:00:00Z',
    status: 'active',
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
        events: ['convo.tags'],
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
