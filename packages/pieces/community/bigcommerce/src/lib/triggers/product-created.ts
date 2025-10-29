import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { bigcommerceAuth } from '../common/auth';
import { bigCommerceApiService } from '../common/requests';

const TRIGGER_NAME = 'product created';
const CACHE_KEY = `${TRIGGER_NAME}-trigger-store-key`;
const TRIGGER_SCOPE = 'store/product/created';

export const productCreated = createTrigger({
  auth: bigcommerceAuth,
  name: 'productCreated',
  displayName: 'Product Created',
  description: 'Triggers when a new product is created',
  props: {},
  sampleData: {},
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    const webhook = await bigCommerceApiService.createWebhook({
      auth: context.auth,
      payload: {
        scope: TRIGGER_SCOPE,
        destination: context.webhookUrl,
        is_active: true,
      },
    });

    await context.store.put(CACHE_KEY, webhook.data.id);
  },
  async onDisable(context) {
    const webhookId = (await context.store.get(CACHE_KEY)) as string;

    if (webhookId) {
      await bigCommerceApiService
        .deleteWebhook({
          auth: context.auth,
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
