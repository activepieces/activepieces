import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { meistertaskAuth } from '../../index';
import { meisterTaskCommon } from '../common/common';

const TRIGGER_NAME = 'new_checklist_item';
const KEY = `${TRIGGER_NAME}_webhook_id`;

export const newChecklistItem = createTrigger({
  auth: meistertaskAuth,
  name: 'new_checklist_item',
  displayName: 'New Checklist Item',
  description: 'Triggers when a new checklist item is added to a task',
  type: TriggerStrategy.WEBHOOK,
  props: {},
  
  sampleData: {
    id: '66666',
    name: 'Checklist item',
    task_id: '67890',
    status: 'open',
    created_at: '2025-01-01T12:00:00Z',
  },
  
  async onEnable(context) {
    const webhook = await meisterTaskCommon.createWebhook(
      context.auth.access_token,
      context.webhookUrl,
      'project',
      '*',
      ['checklist_item:created']
    );
    
    await context.store.put(KEY, webhook.id);
  },
  
  async onDisable(context) {
    const webhookId = await context.store.get<string>(KEY);
    
    if (webhookId) {
      await meisterTaskCommon.deleteWebhook(
        context.auth.access_token,
        webhookId
      ).then(async () => {
        await context.store.delete(KEY);
      });
    }
  },
  
  async run(context) {
    return [context.payload.body];
  },
});