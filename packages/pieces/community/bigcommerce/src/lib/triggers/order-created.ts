import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { bigcommerceAuth } from '../common/auth';
import { bigCommerceApiService } from '../common/requests';

const TRIGGER_NAME = 'order created';
const CACHE_KEY = `${TRIGGER_NAME}-trigger-store-key`;
const TRIGGER_SCOPE = 'store/order/created';

export const orderCreated = createTrigger({
  auth: bigcommerceAuth,
  name: 'orderCreated',
  displayName: 'Order Created',
  description: 'Triggers when a new order is created',
  props: {},
  sampleData: {
    producer: 'stores/xqcaklwsso',
    hash: 'd7b899890f5e0e98a3e074f018b14b07d5d89360',
    created_at: 1761808595,
    store_id: '1003425529',
    scope: 'store/order/created',
    data: {
      type: 'order',
      id: 2,
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
