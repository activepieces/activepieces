import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { tableauAuth } from '../../index';
import { createWebhook, deleteWebhook, WebhookData } from '../common';

export const userDeletedTrigger = createTrigger({
  name: 'user_deleted',
  displayName: 'User Deleted',
  description: 'Triggers when a user is deleted',
  auth: tableauAuth,
  type: TriggerStrategy.WEBHOOK,
  props: {},
  sampleData: {
    resource: 'USER',
    event_type: 'UserDeleted',
    resource_name: 'Deleted User',
    site_luid: 'site-uuid',
    resource_luid: 'user-uuid',
    created_at: '2023-12-01T10:00:00Z',
  },

  async onEnable(context) {
    const webhookData: WebhookData = {
      name: `ActivePieces_User_Deleted_${context.webhookUrl.substring(context.webhookUrl.lastIndexOf('/') + 1)}`,
      event: 'UserDeleted',
      destinationUrl: context.webhookUrl,
    };

    const webhookId = await createWebhook(context.auth, webhookData);
    await context.store?.put('webhook_id', webhookId);
  },

  async onDisable(context) {
    const webhookId = await context.store?.get('webhook_id');
    if (webhookId) {
      await deleteWebhook(context.auth, webhookId as string);
    }
  },

  async run(context) {
    const payload = context.payload.body as any;
    return [payload];
  },
});


