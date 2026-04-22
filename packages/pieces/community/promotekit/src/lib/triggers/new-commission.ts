import {
  createTrigger,
  TriggerStrategy,
  Property,
} from '@activepieces/pieces-framework';
import { promotekitAuth } from '../..';
import { promotekitApiCall, promotekitCommon } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';
export const newCommission = createTrigger({
  auth: promotekitAuth,
  name: 'new_commission',
  displayName: 'New Commission',
  description: 'Triggers when a new commission is generated in PromoteKit.',
  props: {
    instructions: Property.MarkDown({
      value: `### Setup Instructions

1. Go to your PromoteKit dashboard
2. Navigate to **Settings > Webhooks**
3. Click **Add Endpoint**
4. Paste the webhook URL shown below
5. Select the **commission.created** event
6. Save the endpoint`,
    }),
  },
  sampleData: {
    id: '999',
    revenue_amount: 99.99,
    currency: 'usd',
    commission_amount: 19.99,
    payout_status: 'pending',
    referral_date: '2024-01-10T00:00:00Z',
    stripe_payment_id: 'pi_abc123',
    affiliate_id: '123',
    affiliate_email: 'affiliate@example.com',
    referral_id: '789',
    referral_email: 'customer@example.com',
    payout_id: null,
    created_at: '2024-01-15T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z',
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
    return [promotekitCommon.flattenCommission(payload.data)];
  },

  async test(context) {
    const response = await promotekitApiCall<{
      data: Record<string, unknown>[];
    }>({
      token: context.auth as unknown as string,
      method: HttpMethod.GET,
      path: '/commissions',
      queryParams: { limit: '5' },
    });
    return response.body.data.map(promotekitCommon.flattenCommission);
  },
});
