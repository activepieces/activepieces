import {
  createTrigger,
  TriggerStrategy,
  Property,
} from '@activepieces/pieces-framework';
import { promotekitAuth } from '../..';
import { promotekitApiCall, promotekitCommon } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const newEvent = createTrigger({
  auth: promotekitAuth,
  name: 'new_event',
  displayName: 'New Event',
  description:
    'Triggers when a PromoteKit webhook event is received. Configure which events to send from the PromoteKit dashboard.',
  props: {
    instructions: Property.MarkDown({
      value: `### Setup Instructions

1. Go to your PromoteKit dashboard
2. Navigate to **Settings > Webhooks**
3. Click **Add Endpoint**
4. Paste the webhook URL shown below
5. Select the event types you want to receive
6. Save the endpoint

**Supported events:** \`affiliate.created\`, \`affiliate.approved\`, \`referral.created\`, \`referral.converted\`, \`commission.created\``,
    }),
  },
  sampleData: {
    event_type: 'affiliate.created',
    id: '123',
    email: 'affiliate@example.com',
    first_name: 'Jane',
    last_name: 'Doe',
    payout_email: null,
    clicks: 0,
    approved: false,
    banned: false,
    links: null,
    promo_codes: null,
    campaign_id: '456',
    campaign_name: 'Default Campaign',
    campaign_commission_type: 'percentage',
    campaign_commission_amount: 20,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
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
    return [{ event_type: payload.type, ...flattenByType(payload.type, payload.data) }];
  },

  async test(context) {
    const response = await promotekitApiCall<{
      data: Record<string, unknown>[];
    }>({
      token: context.auth as string,
      method: HttpMethod.GET,
      path: '/affiliates',
      queryParams: { limit: '5' },
    });
    return response.body.data.map((a) => ({
      event_type: 'affiliate.created',
      ...promotekitCommon.flattenAffiliate(a),
    }));
  },
});

function flattenByType(
  type: string,
  data: Record<string, unknown>
): Record<string, unknown> {
  if (type === 'affiliate.created' || type === 'affiliate.approved') {
    return promotekitCommon.flattenAffiliate(data);
  }
  if (type === 'referral.created' || type === 'referral.converted') {
    return promotekitCommon.flattenReferral(data);
  }
  if (type === 'commission.created') {
    return promotekitCommon.flattenCommission(data);
  }
  return data;
}
