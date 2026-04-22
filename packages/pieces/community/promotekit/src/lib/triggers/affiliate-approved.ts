import {
  createTrigger,
  TriggerStrategy,
  Property,
} from '@activepieces/pieces-framework';
import { promotekitAuth } from '../..';
import { promotekitApiCall, promotekitCommon } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';
export const affiliateApproved = createTrigger({
  auth: promotekitAuth,
  name: 'affiliate_approved',
  displayName: 'Affiliate Approved',
  description: 'Triggers when an affiliate is approved in PromoteKit.',
  props: {
    instructions: Property.MarkDown({
      value: `### Setup Instructions

1. Go to your PromoteKit dashboard
2. Navigate to **Settings > Webhooks**
3. Click **Add Endpoint**
4. Paste the webhook URL shown below
5. Select the **affiliate.approved** event
6. Save the endpoint`,
    }),
  },
  sampleData: {
    id: '123',
    email: 'affiliate@example.com',
    first_name: 'Jane',
    last_name: 'Doe',
    payout_email: 'payout@example.com',
    clicks: 15,
    approved: true,
    banned: false,
    links: 'https://example.com?ref=jane (jane)',
    promo_codes: null,
    campaign_id: '456',
    campaign_name: 'Default Campaign',
    campaign_commission_type: 'percentage',
    campaign_commission_amount: 20,
    created_at: '2024-01-01T00:00:00Z',
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
    if (payload.type !== 'affiliate.approved') return [];
    return [promotekitCommon.flattenAffiliate(payload.data)];
  },

  async test(context) {
    const response = await promotekitApiCall<{
      data: Record<string, unknown>[];
    }>({
      token: context.auth as unknown as string,
      method: HttpMethod.GET,
      path: '/affiliates',
      queryParams: { limit: '5' },
    });
    return response.body.data.map(promotekitCommon.flattenAffiliate);
  },
});
