import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { CopperApiService } from '../common/requests';
import { CopperAuth } from '../common/constants';

const CACHE_KEY = 'copper_updated_lead_trigger_key';

export const updatedLead = createTrigger({
  auth: CopperAuth,
  name: 'updatedLead',
  displayName: 'Updated Lead',
  description: 'Triggers when a lead is modified.',
  props: {},
  sampleData: {},
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    const response = await CopperApiService.createWebhook(context.auth, {
      target: context.webhookUrl,
      type: 'lead',
      event: 'update',
    });

    await context.store.put(CACHE_KEY, {
      webhookId: response.id,
    });
  },
  async onDisable(context) {
    const cachedWebhookData = (await context.store.get(CACHE_KEY)) as any;

    if (cachedWebhookData) {
      await CopperApiService.deleteWebhook(
        context.auth,
        cachedWebhookData.webhookId
      ).then(async () => {
        await context.store.delete(CACHE_KEY);
      });
    }
  },
  async run(context) {
    return [context.payload.body];
  },
});
