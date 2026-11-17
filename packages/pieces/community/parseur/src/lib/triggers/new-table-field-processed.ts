import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { parseurAuth } from '../auth';
import { parseurApi } from '../common/api';
import { parseurProps } from '../common/props';
import type { ParseurWebhookInformation } from '../common/types';

export const newTableFieldProcessedTrigger = createTrigger({
  auth: parseurAuth,
  name: 'newTableFieldProcessed',
  classification: 'READ',
  displayName: 'New Table Field Processed',
  description:
    'Fires when a document with table fields is processed, and triggers for each row (table field) separately.',
  aiMetadata: {
    description:
      'Fires once per table row when a document containing table fields is parsed in the selected Parseur mailbox, emitting each extracted row individually. Use to process line-item or tabular data row by row rather than as a whole document.',
  },
  props: {
    mailboxId: parseurProps.parserId({ required: true }),
  },
  sampleData: {},
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    const webhook = await parseurApi.createWebhook({
      auth: context.auth,
      event: 'table.processed',
      target: context.webhookUrl,
    });
    await parseurApi.enableWebhook({
      auth: context.auth,
      webhookId: webhook.id,
      mailboxId: context.propsValue.mailboxId,
    });
    await context.store.put<ParseurWebhookInformation>('_newTableFieldProcessed', {
      webhookId: webhook.id,
    });
  },
  async onDisable(context) {
    const webhookInfo = await context.store.get<ParseurWebhookInformation>(
      '_newTableFieldProcessed'
    );
    if (!webhookInfo) {
      return;
    }
    await parseurApi.deleteWebhook({
      auth: context.auth,
      webhookId: webhookInfo.webhookId,
    });
    await context.store.delete('_newTableFieldProcessed');
  },
  async run(context) {
    return [context.payload.body];
  },
});
