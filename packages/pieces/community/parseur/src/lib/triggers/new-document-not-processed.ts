import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { parseurAuth } from '../auth';
import { parseurApi } from '../common/api';
import { parseurProps } from '../common/props';
import type { ParseurWebhookInformation } from '../common/types';

export const newDocumentNotProcessedTrigger = createTrigger({
  auth: parseurAuth,
  name: 'newDocumentNotProcessed',
  classification: 'READ',
  displayName: 'New Document Not Processed',
  description:
    'Fires when Parseur fails to parse a document (e.g. no matching template).',
  aiMetadata: {
    description:
      'Fires when Parseur receives a document but cannot parse it because no matching template exists (template-needed). Use to react to documents that require a new template or manual attention. The mailbox filter is optional; without it, the event fires across mailboxes.',
  },
  props: {
    mailboxId: parseurProps.parserId({ required: false }),
  },
  sampleData: {},
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    const webhook = await parseurApi.createWebhook({
      auth: context.auth,
      event: 'document.template_needed',
      target: context.webhookUrl,
    });
    await parseurApi.enableWebhook({
      auth: context.auth,
      webhookId: webhook.id,
      mailboxId: context.propsValue.mailboxId,
    });
    await context.store.put<ParseurWebhookInformation>('_newDocumentNotProcessed', {
      webhookId: webhook.id,
    });
  },
  async onDisable(context) {
    const webhookInfo = await context.store.get<ParseurWebhookInformation>(
      '_newDocumentNotProcessed'
    );
    if (!webhookInfo) {
      return;
    }
    await parseurApi.deleteWebhook({
      auth: context.auth,
      webhookId: webhookInfo.webhookId,
    });
    await context.store.delete('_newDocumentNotProcessed');
  },
  async run(context) {
    return [context.payload.body];
  },
});
