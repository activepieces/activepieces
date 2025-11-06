import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { CopperApiService } from '../common/requests';
import { CopperAuth } from '../common/constants';

const CACHE_KEY = 'copper_updated_task_trigger_key';

export const updatedTask = createTrigger({
  auth: CopperAuth,
  name: 'updatedTask',
  displayName: 'Updated Task',
  description: 'Triggers when a task is updated.',
  props: {},
  sampleData: {},
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    const response = await CopperApiService.createWebhook(context.auth, {
      target: context.webhookUrl,
      type: 'task',
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
