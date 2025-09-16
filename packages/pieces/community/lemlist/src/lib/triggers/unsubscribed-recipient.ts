import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { lemlistAuth } from '../common/constants';
import { lemlistApiService } from '../common/requests';

const CACHE_KEY = 'lemlist_unsubscribed_recipient_trigger_key';

export const unsubscribedRecipient = createTrigger({
  auth: lemlistAuth,
  name: 'unsubscribedRecipient',
  displayName: 'Unsubscribed Recipient',
  description: 'Triggers when a recipient unsubscribes.',
  props: {},
  sampleData: {},
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    const response = await lemlistApiService.createWebhook(context.auth, {
      targetUrl: context.webhookUrl,
      type: 'emailsUnsubscribed',
    });

    await context.store.put(CACHE_KEY, {
      webhookId: response._id,
    });
  },
  async onDisable(context) {
    const cachedWebhookData: any = await context.store.get(CACHE_KEY);

    if (cachedWebhookData) {
      await lemlistApiService
        .deleteWebhook(context.auth, cachedWebhookData.webhookId)
        .then(async () => {
          await context.store.delete(CACHE_KEY);
        });
    }
  },
  async run(context) {
    return [context.payload.body];
  },
});
