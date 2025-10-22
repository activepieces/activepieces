import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { parseurAuth, parseurCommon } from '../common';
import { parserDropdown } from '../common/properties';
import { WebhookInformation } from '../common/types';

export const newTableFieldProcessed = createTrigger({
  auth: parseurAuth,
  name: 'newTableFieldProcessed',
  displayName: 'New Table Field Processed',
  description:
    'Fires when a document with table fields is processed, and triggers for each row (table field) separately.',
  props: {
    mailboxId: parserDropdown({ required: true }),
  },
  sampleData: {},
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    const response = await parseurCommon.createWebhook({
      apiKey: context.auth,
      event: 'table.processed',
      target: context.webhookUrl,
      category: 'CUSTOM',
    });
    await parseurCommon.enableWebhook({
      apiKey: context.auth as string,
      webhookId: response.id,
      mailboxId: context.propsValue.mailboxId as number,
    });
    await context.store.put<WebhookInformation>('_newTableFieldProcessed', {
      webhookId: response.id,
    });
  },
  async onDisable(context) {
    const webhookInfo = await context.store.get<WebhookInformation>(
      '_newTableFieldProcessed'
    );
    if (!webhookInfo) {
      return;
    }
    await parseurCommon.deleteWebhook({
      apiKey: context.auth,
      webhookId: webhookInfo.webhookId,
    });
    await context.store.delete('_newTableFieldProcessed');
  },
  async run(context) {
    return [context.payload.body];
  },
});
