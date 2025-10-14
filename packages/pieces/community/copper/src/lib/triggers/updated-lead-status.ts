
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { CopperAuth } from '../common/constants';
import { CopperApiService } from '../common/requests';

const CACHE_KEY = 'copper_updated_lead_status_trigger_key';

export const updatedLeadStatus = createTrigger({
    auth: CopperAuth,
    name: 'updatedLeadStatus',
    displayName: 'Updated Lead Status',
    description: 'Triggers when the status of a lead changes.',
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
   const body = context.payload.body as any;
   const ids = Array.isArray(body?.ids) ? body.ids : [];
   const updatedAttrs = body?.updated_attributes ?? {};

   const statusChanged =
     Array.isArray(updatedAttrs.status) &&
     updatedAttrs.status.length === 2 &&
     updatedAttrs.status[0] !== updatedAttrs.status[1];

   if (!statusChanged) {
     return [];
   }

   const events = ids.map((id: number | string) => ({
     id,
     change_type: 'status_change',
     previous_status: updatedAttrs.status?.[0] ?? null,
     current_status: updatedAttrs.status?.[1] ?? null,
     subscription_id: body.subscription_id,
     timestamp: body.timestamp,
   }));

   return events;
  },
})