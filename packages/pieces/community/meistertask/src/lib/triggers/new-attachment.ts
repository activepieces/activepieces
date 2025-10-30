import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { meisterTaskCommon } from '../common/common';
import { meistertaskAuth } from '../../index';

const TRIGGER_NAME = 'new_attachment';
const KEY = `${TRIGGER_NAME}_webhook_id`;

export const newAttachment = createTrigger({
  auth: meistertaskAuth,
  name: 'new_attachment',
  displayName: 'New Attachment',
  description: 'Triggers when an attachment is created',
  type: TriggerStrategy.WEBHOOK,
  props: {},
  
  sampleData: {
    id: '12345',
    name: 'document.pdf',
    url: 'https://example.com/file.pdf',
    task_id: '67890',
    created_at: '2025-01-01T12:00:00Z',
  },
  
  async onEnable(context) {
    const webhook = await meisterTaskCommon.createWebhook(
      context.auth.access_token,
      context.webhookUrl,
      'project',
      '*',
      ['attachment:created']
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

