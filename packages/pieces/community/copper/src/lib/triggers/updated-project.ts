import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { CopperAuth } from '../common/constants';
import { CopperApiService } from '../common/requests';

const CACHE_KEY = 'copper_updated_project_trigger_key';

export const updatedProject = createTrigger({
  auth: CopperAuth,
  name: 'updatedProject',
  displayName: 'Updated Project',
  description: 'Triggers when a project is updated.',
  props: {},
  sampleData: {},
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    const response = await CopperApiService.createWebhook(context.auth, {
      target: context.webhookUrl,
      type: 'project',
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
