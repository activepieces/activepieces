import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { CopperApiService } from '../common/requests';
import { CopperAuth } from '../common/constants';

const CACHE_KEY = 'copper_updated_opportunity_stage_trigger_key';

export const updatedOpportunityStage = createTrigger({
  auth: CopperAuth,
  name: 'updatedOpportunityStage',
  displayName: 'Updated Opportunity Stage',
  description: 'Triggers when an opportunity stage changes',
  props: {},
  sampleData: {},
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    const response = await CopperApiService.createWebhook(context.auth, {
      target: context.webhookUrl,
      type: 'opportunity',
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
    const body = context.payload.body as any;
    const ids = Array.isArray(body.ids) ? body.ids : [];
    const updatedAttrs = body.updated_attributes;

    const idChanged =
      Array.isArray(updatedAttrs.stage_id) &&
      updatedAttrs.stage_id[0] !== updatedAttrs.stage_id[1];
    const labelChanged =
      Array.isArray(updatedAttrs.stage) &&
      updatedAttrs.stage[0] !== updatedAttrs.stage[1];

    const isStageMove = idChanged && labelChanged;
    if (!isStageMove) {
      return [];
    }

    const events = ids.map((id: any) => ({
      id,
      change_type: 'stage_change',
      previous_stage_id: updatedAttrs.stage_id?.[0] ?? null,
      current_stage_id: updatedAttrs.stage_id?.[1] ?? null,
      previous_stage_label: updatedAttrs.stage?.[0] ?? null,
      current_stage_label: updatedAttrs.stage?.[1] ?? null,
      previous_last_stage_at: updatedAttrs.last_stage_at?.[0] ?? null,
      current_last_stage_at: updatedAttrs.last_stage_at?.[1] ?? null,
      previous_days_in_stage: updatedAttrs.days_in_stage?.[0] ?? null,
      current_days_in_stage: updatedAttrs.days_in_stage?.[1] ?? null,
      subscription_id: body.subscription_id,
      timestamp: body.timestamp,
    }));

    return events;
  },
});
