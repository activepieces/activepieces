import {
  createTrigger,
  TriggerStrategy,
  Property,
} from '@activepieces/pieces-framework';
import { promotekitAuth } from '../..';
import { promotekitApiCall, promotekitCommon } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';
export const newReferral = createTrigger({
  auth: promotekitAuth,
  name: 'new_referral',
  displayName: 'New Referral',
  description: 'Triggers when a new referral is tracked in PromoteKit.',
  props: {
    instructions: Property.MarkDown({
      value: `### Setup Instructions

1. Go to your PromoteKit dashboard
2. Navigate to **Settings > Webhooks**
3. Click **Add Endpoint**
4. Paste the webhook URL shown below
5. Select the **referral.created** event
6. Save the endpoint`,
    }),
  },
  sampleData: {
    id: '789',
    email: 'customer@example.com',
    subscription_status: 'active',
    signup_date: '2024-01-10T00:00:00Z',
    stripe_customer_id: 'cus_abc123',
    affiliate_id: '123',
    affiliate_email: 'affiliate@example.com',
    affiliate_first_name: 'Jane',
    affiliate_last_name: 'Doe',
    created_at: '2024-01-10T00:00:00Z',
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
    if (payload.type !== 'referral.created') return [];
    return [promotekitCommon.flattenReferral(payload.data)];
  },

  async test(context) {
    const response = await promotekitApiCall<{
      data: Record<string, unknown>[];
    }>({
      token: context.auth as unknown as string,
      method: HttpMethod.GET,
      path: '/referrals',
      queryParams: { limit: '5' },
    });
    return response.body.data.map(promotekitCommon.flattenReferral);
  },
});
