import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { ZOHO_WEBHOOK_TOKEN } from '../common/constants';
import { biginAuth } from '../../index';
import { biginApiService } from '../common/request';

const CACHE_KEY = 'bigin_pipeline_record_updated_trigger';

export const pipelineRecordUpdated = createTrigger({
  auth: biginAuth,
  name: 'pipelineRecordUpdated',
  displayName: 'Pipeline Record Updated',
  description: 'Triggers when a pipeline record is updated',
  props: {},
  sampleData: {},
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    try {
      const channel_id = Date.now().toString();
      const { api_domain } = context.auth as any;

      const webhookData = {
        watch: [
          {
            channel_id,
            events: ['Pipelines.edit'],
            notify_url: context.webhookUrl,
            token: ZOHO_WEBHOOK_TOKEN,
          },
        ],
      };

      await biginApiService.createWebhook(
        context.auth.access_token,
        webhookData,
        api_domain
      );

      await context.store.put(CACHE_KEY, channel_id);
    } catch (error) {
      console.error('Failed to enable Zoho webhook');
    }
  },
  async onDisable(context) {
    const channel_id = (await context.store.get(CACHE_KEY)) as string;
    if (!channel_id) return;

    const { api_domain } = context.auth as any;

    await biginApiService.deleteWebhook(
      context.auth.access_token,
      api_domain,
      channel_id
    );

    await context.store.delete(CACHE_KEY);
  },
  async run(context) {
    const { token } = context.payload.body as any;

    if (token !== ZOHO_WEBHOOK_TOKEN) {
      throw new Error('Invalid webhook token');
    }

    return [context.payload.body];
  },
});
