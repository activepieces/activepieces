import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { signNowAuth, getSignNowBearerToken } from '../common/auth';
import { getUserId, registerWebhook, unregisterWebhook } from '../common/webhook';

const STORE_KEY = 'sign_now_document_updated_subscription_id';

export const documentUpdatedTrigger = createTrigger({
  auth: signNowAuth,
  name: 'document_updated',
  displayName: 'Document Updated',
  description: 'Triggers when a document has been updated.',
  props: {},
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    const token = getSignNowBearerToken(context.auth);
    const userId = await getUserId(token);
    const subscriptionId = await registerWebhook(
      context.auth,
      'user.document.update',
      userId,
      context.webhookUrl
    );
    await context.store.put(STORE_KEY, subscriptionId);
  },
  async onDisable(context) {
    const subscriptionId = await context.store.get<string>(STORE_KEY);
    if (subscriptionId) {
      await unregisterWebhook(context.auth, subscriptionId);
      await context.store.delete(STORE_KEY);
    }
  },
  async run(context) {
    return [context.payload.body];
  },
  sampleData: {
    meta: {
      timestamp: 1661430936,
      event: 'user.document.update',
      environment: 'https://api.signnow.com',
      callback_url: 'https://your-callback-url.com',
    },
    content: {
      document_id: 'a1b2c3d4e5f67890123456789abcdef012345678',
      document_name: 'Contract.pdf',
      user_id: 'b2c3d4e5f67890123456789abcdef0123456789a',
    },
  },
});
