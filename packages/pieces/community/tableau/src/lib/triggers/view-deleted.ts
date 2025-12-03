import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { tableauAuth } from '../../index';
import { createWebhook, deleteWebhook, WebhookData } from '../common';

export const viewDeletedTrigger = createTrigger({
  name: 'view_deleted',
  displayName: 'View Deleted',
  description: 'Triggers when a workbook view is deleted',
  auth: tableauAuth,
  type: TriggerStrategy.WEBHOOK,
  props: {},
  sampleData: {
    resource: 'VIEW',
    event_type: 'ViewDeleted',
    resource_name: 'Deleted View',
    site_luid: 'site-uuid',
    resource_luid: 'view-uuid',
    created_at: '2023-12-01T10:00:00Z',
  },

  async onEnable(context) {
    const webhookData: WebhookData = {
      name: `ActivePieces_View_Deleted_${context.webhookUrl.substring(context.webhookUrl.lastIndexOf('/') + 1)}`,
      event: 'ViewDeleted',
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


