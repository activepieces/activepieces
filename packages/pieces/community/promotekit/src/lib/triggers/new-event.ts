import {
  createTrigger,
  TriggerStrategy,
  Property,
} from '@activepieces/pieces-framework';
import { promotekitAuth } from '../..';
import { promotekitApiCall, promotekitCommon } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

const EVENT_TYPE_OPTIONS = [
  { label: 'Affiliate Created', value: 'affiliate.created' },
  { label: 'Affiliate Approved', value: 'affiliate.approved' },
  { label: 'Referral Created', value: 'referral.created' },
  { label: 'Referral Converted', value: 'referral.converted' },
  { label: 'Commission Created', value: 'commission.created' },
];

export const newEvent = createTrigger({
  auth: promotekitAuth,
  name: 'new_event',
  displayName: 'New Event',
  description: 'Triggers when a PromoteKit webhook event is received.',
  props: {
    eventType: Property.StaticDropdown({
      displayName: 'Event Type',
      description: 'The event type this flow should react to.',
      required: true,
      options: { options: EVENT_TYPE_OPTIONS },
    }),
    instructions: Property.MarkDown({
      value: `### Setup Instructions

1. Go to your PromoteKit dashboard
2. Navigate to **Settings > Webhooks**
3. Click **Add Endpoint**
4. Paste the webhook URL shown below
5. Enable the event type you selected above
6. Save the endpoint

**Need different flows for different events?** Create a separate flow with its own webhook URL, and add a new endpoint in PromoteKit for that flow with only the matching event enabled.`,
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
    if (payload.type !== context.propsValue.eventType) return [];
    return [
      {
        type: payload.type,
        ...flattenByType(payload.type, payload.data),
      },
    ];
  },

  async test(context) {
    const eventType = context.propsValue.eventType;
    const { path, flatten } = resolveEndpoint(eventType);
    const response = await promotekitApiCall<{ data: Record<string, unknown>[] }>({
      token: context.auth.secret_text,
      method: HttpMethod.GET,
      path,
      queryParams: { limit: '5' },
    });
    return response.body.data.map((item) => ({
      type: eventType,
      ...flatten(item),
    }));
  },
});

function resolveEndpoint(eventType: string): {
  path: string;
  flatten: (data: Record<string, unknown>) => Record<string, unknown>;
} {
  if (eventType === 'affiliate.created' || eventType === 'affiliate.approved') {
    return { path: '/affiliates', flatten: promotekitCommon.flattenAffiliate };
  }
  if (eventType === 'referral.created' || eventType === 'referral.converted') {
    return { path: '/referrals', flatten: promotekitCommon.flattenReferral };
  }
  return { path: '/commissions', flatten: promotekitCommon.flattenCommission };
}

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
