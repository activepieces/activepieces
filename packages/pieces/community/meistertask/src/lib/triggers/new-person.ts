import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { meistertaskAuth } from '../../index';
import { meisterTaskCommon } from '../common/common';

const TRIGGER_NAME = 'new_person';
const KEY = `${TRIGGER_NAME}_webhook_id`;

export const newPerson = createTrigger({
  auth: meistertaskAuth,
  name: 'new_person',
  displayName: 'New Person',
  description: 'Triggers when a new person is added to a project',
  type: TriggerStrategy.WEBHOOK,
  props: {},
  
  sampleData: {
    id: '11111',
    firstname: 'John',
    lastname: 'Doe',
    email: 'john@example.com',
    project_id: '22222',
    added_at: '2025-01-01T12:00:00Z',
  },
  
  async onEnable(context) {
    const webhook = await meisterTaskCommon.createWebhook(
      context.auth.access_token,
      context.webhookUrl,
      'project',
      '*',
      ['person:added']
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
