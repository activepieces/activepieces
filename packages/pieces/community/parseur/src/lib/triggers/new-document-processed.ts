import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { parseurAuth, parseurCommon } from '../common';
import { parserDropdown } from '../common/properties';
import { WebhookInformation } from '../common/types';

export const newDocumentProcessed = createTrigger({
  auth: parseurAuth,
  name: 'newDocumentProcessed',
  displayName: 'New Document Processed',
  description:
    'Fires when a new document is successfully processed and parsed by Parseur.',
  props: {
    mailboxId: parserDropdown({ required: true }),
  },
  sampleData: {},
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    const webhookCreateResponse = await parseurCommon.createWebhook({
      apiKey: context.auth,
      event: 'document.processed',
      target: context.webhookUrl,
      category: 'CUSTOM',
    });
    await parseurCommon.enableWebhook({
      apiKey: context.auth as string,
      webhookId: webhookCreateResponse.id,
      mailboxId: context.propsValue.mailboxId as number,
    });
    await context.store.put<WebhookInformation>('_newDocumentProcessed', {
      webhookId: webhookCreateResponse.id,
    });
  },
  async onDisable(context) {
    const webhookInfo = await context.store.get<WebhookInformation>(
      '_newDocumentProcessed'
    );
    if (!webhookInfo) {
      return;
    }
    await parseurCommon.deleteWebhook({
      apiKey: context.auth,
      webhookId: webhookInfo.webhookId,
    });
    await context.store.delete('_newDocumentProcessed');
  },
  async run(context) {
    return [context.payload.body];
  },
});
