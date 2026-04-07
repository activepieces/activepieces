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
      description: 'The event type this trigger should respond to.',
      required: true,
      options: { options: EVENT_TYPE_OPTIONS },
    }),
    instructions: Property.MarkDown({
      value: `### Setup Instructions

1. Go to your PromoteKit dashboard
2. Navigate to **Settings > Webhooks**
3. Click **Add Endpoint**
4. Paste the webhook URL shown below
5. Enable the event type you selected above (and any others you need for separate flows)
6. Save the endpoint`,
    }),
  },
  sampleData: {
    id: 'sample-id',
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
    return [flattenByType(payload.type, payload.data)];
  },

  async test(context) {
    const eventType = context.propsValue.eventType;
    if (eventType === 'affiliate.created' || eventType === 'affiliate.approved') {
      const response = await promotekitApiCall<{ data: Record<string, unknown>[] }>({
        token: context.auth.secret_text,
        method: HttpMethod.GET,
        path: '/affiliates',
        queryParams: { limit: '5' },
      });
      return response.body.data.map(promotekitCommon.flattenAffiliate);
    }
    if (eventType === 'referral.created' || eventType === 'referral.converted') {
      const response = await promotekitApiCall<{ data: Record<string, unknown>[] }>({
        token: context.auth.secret_text,
        method: HttpMethod.GET,
        path: '/referrals',
        queryParams: { limit: '5' },
      });
      return response.body.data.map(promotekitCommon.flattenReferral);
    }
    const response = await promotekitApiCall<{ data: Record<string, unknown>[] }>({
      token: context.auth.secret_text,
      method: HttpMethod.GET,
      path: '/commissions',
      queryParams: { limit: '5' },
    });
    return response.body.data.map(promotekitCommon.flattenCommission);
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
