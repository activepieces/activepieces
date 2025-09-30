import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { parseurAuth, parseurCommon } from '../common';
import { parserDropdown } from '../common/properties';
import { WebhookInformation } from '../common/types';

export const newDocumentNotProcessed = createTrigger({
  auth: parseurAuth,
  name: 'newDocumentNotProcessed',
  displayName: 'New Document Not Processed',
  description:
    'Fires when Parseur fails to parse a document (e.g. no matching template).',
  props: {
    mailboxId: parserDropdown({ required: false }),
  },
  sampleData: {},
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    const response = await parseurCommon.createWebhook({
      apiKey: context.auth,
      event: 'document.template_needed',
      target: context.webhookUrl,
      category: 'CUSTOM',
    });
    await parseurCommon.enableWebhook({
      apiKey: context.auth as string,
      webhookId: response.id,
      mailboxId: context.propsValue.mailboxId as number,
    });
    await context.store.put<WebhookInformation>('_newDocumentNotProcessed', {
      webhookId: response.id,
    });
  },
  async onDisable(context) {
    const webhookInfo = await context.store.get<WebhookInformation>(
      '_newDocumentNotProcessed'
    );
    if (!webhookInfo) {
      return;
    }
    await parseurCommon.deleteWebhook({
      apiKey: context.auth,
      webhookId: webhookInfo.webhookId,
    });
    await context.store.delete('_newDocumentNotProcessed');
  },
  async run(context) {
    return [context.payload.body];
  },
});
