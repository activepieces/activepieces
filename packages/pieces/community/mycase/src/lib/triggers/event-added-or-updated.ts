import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { myCaseAuth } from '../common/auth';
import { myCaseApiService } from '../common/requests';

const MODEL = 'event';
const CACHE_KEY = `${MODEL}-added-or-updated-store-key`;

export const eventAddedOrUpdated = createTrigger({
  auth: myCaseAuth,
  name: 'eventAddedOrUpdated',
  displayName: 'Event Added or Updated',
  description: 'Triggers when an event has been added or updated',
  props: {},
  sampleData: {},
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    const subscription = await myCaseApiService.createWebhookSubscription({
      accessToken: context.auth.access_token,
      payload: {
        model: MODEL,
        actions: ['created', 'updated'],
        url: context.webhookUrl,
      },
    });

    await context.store.put(CACHE_KEY, subscription.id);
  },
  async onDisable(context) {
    const webhookId = (await context.store.get(CACHE_KEY)) as string;

    if (webhookId) {
      await myCaseApiService
        .deleteWebhookSubscription({
          accessToken: context.auth.access_token,
          webhookId,
        })
        .then(async () => {
          await context.store.delete(CACHE_KEY);
        });
    }
  },
  async run(context) {
    return [context.payload.body];
  },
});
