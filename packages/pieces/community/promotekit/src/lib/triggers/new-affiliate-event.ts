import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { promotekitAuth } from '../..';
import { promotekitApiCall, promotekitCommon } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

const AFFILIATE_EVENT_OPTIONS = [
  { label: 'Affiliate Created', value: 'affiliate.created' },
  { label: 'Affiliate Approved', value: 'affiliate.approved' },
];

export const newAffiliateEvent = createTrigger({
  auth: promotekitAuth,
  name: 'new_affiliate_event',
  displayName: 'New Affiliate Event',
  description: 'Triggers when a PromoteKit affiliate webhook event is received.',
  props: {
    eventTypes: Property.StaticMultiSelectDropdown({
      displayName: 'Affiliate Event Types',
      description:
        'Select the affiliate event types to listen for. Leave empty to receive all affiliate events.',
      required: false,
      options: { options: AFFILIATE_EVENT_OPTIONS },
    }),
    instructions: Property.MarkDown({
      value: `### Setup Instructions

1. Go to your PromoteKit dashboard
2. Navigate to **Settings > Webhooks**
3. Click **Add Endpoint**
4. Paste the webhook URL shown below
5. Enable the affiliate event types you selected above
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
    approved: false,
    banned: false,
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
    const selected: string[] = context.propsValue.eventTypes ?? [];
    const isAffiliate =
      payload.type === 'affiliate.created' ||
      payload.type === 'affiliate.approved';
    if (!isAffiliate) return [];
    if (selected.length > 0 && !selected.includes(payload.type)) return [];
    return [{ type: payload.type, ...promotekitCommon.flattenAffiliate(payload.data) }];
  },

  async test(context) {
    const response = await promotekitApiCall<{ data: Record<string, unknown>[] }>({
      token: context.auth.secret_text,
      method: HttpMethod.GET,
      path: '/affiliates',
      queryParams: { limit: '5' },
    });
    const selected: string[] = context.propsValue.eventTypes ?? [];
    const eventType = selected.length === 1 ? selected[0] : 'affiliate.created';
    return response.body.data.map((item) => ({
      type: eventType,
      ...promotekitCommon.flattenAffiliate(item),
    }));
  },
});
