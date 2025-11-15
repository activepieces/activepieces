import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { tableauAuth } from '../../index';
import { createWebhook, deleteWebhook, WebhookData } from '../common';

export const workbookEventTrigger = createTrigger({
  name: 'workbook_event',
  displayName: 'Workbook Event',
  description: 'Triggers when a workbook event occurs (created, updated, or deleted)',
  auth: tableauAuth,
  type: TriggerStrategy.WEBHOOK,
  props: {
    eventType: Property.StaticDropdown({
      displayName: 'Event Type',
      description: 'Select the workbook event to trigger on',
      required: true,
      options: {
        disabled: false,
        options: [
          { label: 'Created', value: 'WorkbookCreated' },
          { label: 'Updated', value: 'WorkbookUpdated' },
          { label: 'Deleted', value: 'WorkbookDeleted' },
        ],
      },
      defaultValue: 'WorkbookCreated',
    }),
  },
  sampleData: {
    resource: 'WORKBOOK',
    event_type: 'WorkbookCreated',
    resource_name: 'Sample Workbook',
    site_luid: 'site-uuid',
    resource_luid: 'workbook-uuid',
    created_at: '2023-12-01T10:00:00Z',
  },

  async onEnable(context) {
    const eventType = context.propsValue.eventType;
    const webhookData: WebhookData = {
      name: `ActivePieces_Workbook_${eventType}_${context.webhookUrl.substring(context.webhookUrl.lastIndexOf('/') + 1)}`,
      event: eventType,
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

