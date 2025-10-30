import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { meistertaskAuth } from '../../index';
import { meisterTaskCommon } from '../common/common';

const TRIGGER_NAME = 'new_task';
const KEY = `${TRIGGER_NAME}_webhook_id`;

export const newTask = createTrigger({
  auth: meistertaskAuth,
  name: 'new_task',
  displayName: 'New Task',
  description: 'Triggers when a task is created or changed',
  type: TriggerStrategy.WEBHOOK,
  props: {},
  
  sampleData: {
    id: '67890',
    name: 'Task Name',
    notes: 'Task description',
    section_id: '33333',
    status: 1,
    assigned_to_id: '11111',
    created_at: '2025-01-01T12:00:00Z',
    updated_at: '2025-01-01T12:00:00Z',
  },
  
  async onEnable(context) {
    const webhook = await meisterTaskCommon.createWebhook(
      context.auth.access_token,
      context.webhookUrl,
      'project',
      '*',
      ['task:created', 'task:updated']
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