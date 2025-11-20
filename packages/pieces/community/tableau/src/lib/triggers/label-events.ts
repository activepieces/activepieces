import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { tableauAuth } from '../../index';
import { createWebhook, deleteWebhook, WebhookData } from '../common';

export const labelEventTrigger = createTrigger({
  name: 'label_event',
  displayName: 'Label Event',
  description: 'Triggers when a label event occurs (created, updated, or deleted)',
  auth: tableauAuth,
  type: TriggerStrategy.WEBHOOK,
  props: {
    eventType: Property.StaticDropdown({
      displayName: 'Event Type',
      description: 'Select the label event to trigger on',
      required: true,
      options: {
        disabled: false,
        options: [
          { label: 'Created', value: 'LabelCreated' },
          { label: 'Updated', value: 'LabelUpdated' },
          { label: 'Deleted', value: 'LabelDeleted' },
        ],
      },
      defaultValue: 'LabelCreated',
    }),
  },
  sampleData: {
    resource: 'DATASOURCE',
    event_type: 'LabelCreated',
    resource_name: 'Sample Asset',
    site_luid: 'site-uuid',
    resource_luid: 'asset-uuid',
    created_at: '2023-12-01T10:00:00Z',
  },

  async onEnable(context) {
    const eventType = context.propsValue.eventType;
    const webhookData: WebhookData = {
      name: `ActivePieces_Label_${eventType}_${context.webhookUrl.substring(context.webhookUrl.lastIndexOf('/') + 1)}`,
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
