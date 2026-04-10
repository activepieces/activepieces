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
  description: 'Triggers when a PromoteKit webhook event is received.',
  props: {
    instructions: Property.MarkDown({
      value: `### Setup Instructions

1. Go to your PromoteKit dashboard
2. Navigate to **Settings > Webhooks**
3. Click **Add Endpoint**
4. Paste the webhook URL shown below
5. Select the event types you want this flow to react to
6. Save the endpoint

**Need different flows for different events?** Create a separate flow with its own webhook URL, then add a new endpoint in PromoteKit with only the events for that flow.`,
    }),
  },
  sampleData: {
    type: 'affiliate.created',
    id: 'aff_sample',
    email: 'affiliate@example.com',
    first_name: 'John',
    last_name: 'Doe',
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
    return [
      {
        type: payload.type,
        ...flattenByType(payload.type, payload.data),
      },
    ];
  },

  async test(context) {
    const response = await promotekitApiCall<{ data: Record<string, unknown>[] }>({
      token: context.auth.secret_text,
      method: HttpMethod.GET,
      path: '/affiliates',
      queryParams: { limit: '5' },
    });
    return response.body.data.map((item) => ({
      type: 'affiliate.created',
      ...promotekitCommon.flattenAffiliate(item),
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
