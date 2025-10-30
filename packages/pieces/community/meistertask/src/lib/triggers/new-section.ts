import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { meistertaskAuth } from '../../index';
import { meisterTaskCommon } from '../common/common';

const TRIGGER_NAME = 'new_section';
const KEY = `${TRIGGER_NAME}_webhook_id`;

export const newSectionTrigger = createTrigger({
  auth: meistertaskAuth,
  name: 'new_section',
  displayName: 'New Section',
  description: 'Triggers when a new section is created',
  type: TriggerStrategy.WEBHOOK,
  props: {},
  
  sampleData: {
    id: '33333',
    name: 'To Do',
    project_id: '22222',
    order: 1,
    created_at: '2025-01-01T12:00:00Z',
  },
  
  async onEnable(context) {
    const webhook = await meisterTaskCommon.createWebhook(
      context.auth.access_token,
      context.webhookUrl,
      'project',
      '*',
      ['section:created']
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