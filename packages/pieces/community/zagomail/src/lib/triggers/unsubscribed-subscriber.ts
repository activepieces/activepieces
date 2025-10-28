
import { zagomailAuth } from '../../';
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { zagoMailApiService } from '../common/request';
import { StoredWebhookId, WebhookResponse } from '../common/constants';
import { isNil } from '@activepieces/shared';

const CACHE_KEY = 'zagomail_unsubscribed_subscriber_trigger_store';

export const unsubscribedSubscriber = createTrigger({
  auth: zagomailAuth,
  name: 'unsubscribedSubscriber',
  displayName: 'Unsubscribed Subscriber',
  description: 'Triggers when subscriber is unsubscribed.',
  props: {},
  sampleData: {
    action: 'subscriber-unsubscribe',
    subscriber_uid: 'dg307jyx044e1',
    list_uid: 'or449cjkqqfb2',
    email: 'gs03dev@gmail.com',
    status: 'unsubscribed',
    created_at: '2025-05-11 08:26:16',
    custom_fields: {
      FNAME: 'gs03',
      LNAME: 'dev',
    },
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    const response = (await zagoMailApiService.createWebhook(
      context.auth,
      context.webhookUrl,
      'subscriber-unsubscribe'
    )) as WebhookResponse;

    await context.store.put<StoredWebhookId>(CACHE_KEY, {
      webhookId: response.id,
    });
  },
  async onDisable(context) {
    const webhook = await context.store.get<StoredWebhookId>(CACHE_KEY);
    if (!isNil(webhook) && !isNil(webhook.webhookId)) {
      await zagoMailApiService.deleteWebhook(context.auth, webhook.webhookId);
    }
  },
  async run(context) {
    return [context.payload.body];
  },
});