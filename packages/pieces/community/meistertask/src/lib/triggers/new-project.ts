import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { meistertaskAuth } from '../../index';
import { meisterTaskCommon } from '../common/common';

const TRIGGER_NAME = 'new_project';
const KEY = `${TRIGGER_NAME}_webhook_id`;

export const newProject = createTrigger({
  auth: meistertaskAuth,
  name: 'new_project',
  displayName: 'New Project',
  description: 'Triggers when a new project is created',
  type: TriggerStrategy.WEBHOOK,
  props: {},
  
  sampleData: {
    id: '22222',
    name: 'New Project',
    created_at: '2025-01-01T12:00:00Z',
  },
  
  async onEnable(context) {
    const webhook = await meisterTaskCommon.createWebhook(
      context.auth.access_token,
      context.webhookUrl,
      'account',
      '*',
      ['project:created']
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