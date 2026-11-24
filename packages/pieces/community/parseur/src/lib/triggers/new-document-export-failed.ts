import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { parseurAuth } from '../auth';
import { parseurApi } from '../common/api';
import { parseurProps } from '../common/props';
import type { ParseurWebhookInformation } from '../common/types';

export const newDocumentExportFailedTrigger = createTrigger({
  auth: parseurAuth,
  name: 'newDocumentExportFailed',
  classification: 'READ',
  displayName: 'New Document Export Failed',
  description:
    'Fires when an automated export endpoint (webhook / integration) fails for a processed document.',
  aiMetadata: {
    description:
      'Fires when delivering a successfully parsed document to a configured export target (webhook or downstream integration) fails for the selected Parseur mailbox. Use to detect and handle export/delivery failures.',
  },
  props: {
    mailboxId: parseurProps.parserId({ required: true }),
  },
  sampleData: {},
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    const webhook = await parseurApi.createWebhook({
      auth: context.auth,
      event: 'document.export_failed',
      target: context.webhookUrl,
    });
    await parseurApi.enableWebhook({
      auth: context.auth,
      webhookId: webhook.id,
      mailboxId: context.propsValue.mailboxId,
    });
    await context.store.put<ParseurWebhookInformation>('_newDocumentExportFailed', {
      webhookId: webhook.id,
    });
  },
  async onDisable(context) {
    const webhookInfo = await context.store.get<ParseurWebhookInformation>(
      '_newDocumentExportFailed'
    );
    if (!webhookInfo) {
      return;
    }
    await parseurApi.deleteWebhook({
      auth: context.auth,
      webhookId: webhookInfo.webhookId,
    });
    await context.store.delete('_newDocumentExportFailed');
  },
  async run(context) {
    return [context.payload.body];
  },
});
