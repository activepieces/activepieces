import {
  createTrigger,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { isNil } from '@activepieces/shared';
import { zagomailAuth } from '../../index';
import { zagoMailApiService, } from '../common/request';
import { StoredWebhookId, WebhookResponse } from '../common/constants';

const CACHE_KEY = 'zagomail_added_subscriber_trigger';

export const addedSubscriber = createTrigger({
  auth: zagomailAuth,
  name: 'addedSubscriber',
  displayName: 'Subscriber Added',
  description: 'Triggers when subscriber is signed up or confirmed.',
  props: {},
  type: TriggerStrategy.WEBHOOK,
  sampleData: {
    action: 'subscriber-activate',
    subscriber_uid: 'dg307jyx044e1',
    list_uid: 'or449cjkqqfb2',
    email: 'gs03dev@gmail.com',
    status: 'confirmed',
    created_at: '2025-05-11 08:26:16',
    custom_fields: {
      FNAME: 'gs03',
      LNAME: 'dev',
    },
  },
  async onEnable(context) {
    const response = (await zagoMailApiService.createWebhook(
      context.auth,
      context.webhookUrl,
      'subscriber-activate'
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
