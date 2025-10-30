import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { meistertaskAuth } from '../../index';
import { meisterTaskCommon } from '../common/common';

const TRIGGER_NAME = 'new_task_label';
const KEY = `${TRIGGER_NAME}_webhook_id`;

export const newTaskLabel = createTrigger({
  auth: meistertaskAuth,
  name: 'new_task_label',
  displayName: 'New Task Label',
  description: 'Triggers when a task label is created',
  type: TriggerStrategy.WEBHOOK,
  props: {},
  
  sampleData: {
    id: '55555',
    task_id: '67890',
    label_id: '88888',
    created_at: '2025-01-01T12:00:00Z',
  },
  
  async onEnable(context) {
    const webhook = await meisterTaskCommon.createWebhook(
      context.auth.access_token,
      context.webhookUrl,
      'project',
      '*',
      ['task_label:created']
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