import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { promotekitAuth } from '../..';
import { promotekitApiCall, promotekitCommon } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const newCommissionEvent = createTrigger({
  auth: promotekitAuth,
  name: 'new_commission_event',
  displayName: 'New Commission Event',
  description: 'Triggers when a PromoteKit commission webhook event is received.',
  props: {
    instructions: Property.MarkDown({
      value: `### Setup Instructions

1. Go to your PromoteKit dashboard
2. Navigate to **Settings > Webhooks**
3. Click **Add Endpoint**
4. Paste the webhook URL shown below
5. Enable the **Commission Created** event
6. Save the endpoint`,
    }),
  },
  sampleData: {
    type: 'commission.created',
    id: 'com_sample',
    revenue_amount: 100,
    currency: 'usd',
    commission_amount: 20,
    payout_status: 'pending',
    affiliate_id: 'aff_sample',
    affiliate_email: 'affiliate@example.com',
    created_at: '2024-01-01T00:00:00Z',
  },
  type: TriggerStrategy.WEBHOOK,

  async onEnable() {
    // Webhook is configured manually in PromoteKit dashboard
  },

  async onDisable() {
    // Webhook is configured manually in PromoteKit dashboard
  },

  async run(context) {
    const payload = context.payload.body as {
      type: string;
      data: Record<string, unknown>;
    };
    if (payload.type !== 'commission.created') return [];
    return [{ type: payload.type, ...promotekitCommon.flattenCommission(payload.data) }];
  },

  async test(context) {
    const response = await promotekitApiCall<{ data: Record<string, unknown>[] }>({
      token: context.auth.secret_text,
      method: HttpMethod.GET,
      path: '/commissions',
      queryParams: { limit: '5' },
    });
    return response.body.data.map((item) => ({
      type: 'commission.created',
      ...promotekitCommon.flattenCommission(item),
    }));
  },
});
