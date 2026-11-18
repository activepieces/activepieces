import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { parseurAuth } from '../auth';
import { parseurApi } from '../common/api';
import { parseurProps } from '../common/props';
import type { ParseurWebhookInformation } from '../common/types';

export const newDocumentProcessedTrigger = createTrigger({
  auth: parseurAuth,
  name: 'newDocumentProcessed',
  classification: 'READ',
  displayName: 'New Document Processed',
  description:
    'Fires when a new document is successfully processed and parsed by Parseur.',
  aiMetadata: {
    description:
      'Fires when a document in the selected Parseur mailbox is successfully parsed, emitting the document with its extracted/structured fields. Use to react to newly available parsed data.',
  },
  props: {
    mailboxId: parseurProps.parserId({ required: true }),
  },
  sampleData: {},
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    const webhook = await parseurApi.createWebhook({
      auth: context.auth,
      event: 'document.processed',
      target: context.webhookUrl,
    });
    await parseurApi.enableWebhook({
      auth: context.auth,
      webhookId: webhook.id,
      mailboxId: context.propsValue.mailboxId,
    });
    await context.store.put<ParseurWebhookInformation>('_newDocumentProcessed', {
      webhookId: webhook.id,
    });
  },
  async onDisable(context) {
    const webhookInfo = await context.store.get<ParseurWebhookInformation>(
      '_newDocumentProcessed'
    );
    if (!webhookInfo) {
      return;
    }
    await parseurApi.deleteWebhook({
      auth: context.auth,
      webhookId: webhookInfo.webhookId,
    });
    await context.store.delete('_newDocumentProcessed');
  },
  async run(context) {
    return [context.payload.body];
  },
});
