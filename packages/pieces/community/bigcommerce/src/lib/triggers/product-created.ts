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
  sampleData: {
    producer: 'stores/xqcaklwsso',
    hash: 'c6db17090e98d2c58c0cb1988b5e9ace48215e22',
    created_at: 1761808831,
    store_id: '1003425529',
    scope: 'store/product/created',
    data: {
      type: 'product',
      id: 113,
    },
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    const webhook = await bigCommerceApiService.createWebhook({
      auth: context.auth.props,
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
          auth: context.auth.props,
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
