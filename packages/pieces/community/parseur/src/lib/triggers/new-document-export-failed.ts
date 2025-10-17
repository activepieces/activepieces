import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { parseurAuth, parseurCommon } from '../common';
import { parserDropdown } from '../common/properties';
import { WebhookInformation } from '../common/types';

export const newDocumentExportFailed = createTrigger({
  auth: parseurAuth,
  name: 'newDocumentExportFailed',
  displayName: 'New Document Export Failed',
  description:
    'Fires when an automated export endpoint (webhook / integration) fails for a processed document.',
  props: { mailboxId: parserDropdown({ required: true }) },
  sampleData: {},
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    const response = await parseurCommon.createWebhook({
      apiKey: context.auth,
      event: 'document.export_failed',
      target: context.webhookUrl,
      category: 'CUSTOM',
    });
    await parseurCommon.enableWebhook({
      apiKey: context.auth as string,
      webhookId: response.id,
      mailboxId: context.propsValue.mailboxId as number,
    });
    await context.store.put<WebhookInformation>('_newDocumentExportFailed', {
      webhookId: response.id,
    });
  },
  async onDisable(context) {
    const webhookInfo = await context.store.get<WebhookInformation>(
      '_newDocumentExportFailed'
    );
    if (!webhookInfo) {
      return;
    }
    await parseurCommon.deleteWebhook({
      apiKey: context.auth,
      webhookId: webhookInfo.webhookId,
    });
    await context.store.delete('_newDocumentExportFailed');
  },
  async run(context) {
    return [context.payload.body];
  },
});
