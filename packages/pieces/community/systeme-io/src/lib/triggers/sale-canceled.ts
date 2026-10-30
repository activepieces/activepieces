import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { systemeIoAuth } from '../common/auth';
import { systemeWebhook } from '../common/webhook';
import { saleSample } from '../common/samples';
import { saleTriggerOutputSchema } from '../output-schemas';

const PREFIX = 'sale_canceled';

export const saleCanceled = createTrigger({
  auth: systemeIoAuth,
  name: 'sale_canceled',
  classification: 'READ',
  displayName: 'Sale Canceled',
  description: 'Fires when a sale is canceled (a subscription is canceled or a one-off payment is refunded)',
  aiMetadata: {
    description:
      'Fires when a Systeme.io sale is canceled, such as a subscription cancellation or a refund, delivering the same customer, order, order item, price plan, funnel step and coupon data as New Sale. Use to revoke access or update records when a purchase is reversed.',
  },
  props: {},
  sampleData: saleSample,
  outputSchema: saleTriggerOutputSchema,
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    await systemeWebhook.enable({
      auth: context.auth,
      webhookUrl: context.webhookUrl,
      store: context.store,
      event: 'SALE_CANCELED',
      prefix: PREFIX,
    });
  },
  async onDisable(context) {
    await systemeWebhook.disable({ auth: context.auth, store: context.store, prefix: PREFIX });
  },
  async run(context) {
    if (!(await systemeWebhook.accept({ store: context.store, payload: context.payload, prefix: PREFIX }))) {
      return [];
    }
    return [systemeWebhook.unwrap({ body: context.payload.body, key: 'sale' })];
  },
});
