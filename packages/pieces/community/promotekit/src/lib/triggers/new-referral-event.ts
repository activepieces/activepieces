import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { promotekitAuth } from '../..';
import { promotekitApiCall, promotekitCommon } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

const REFERRAL_EVENT_OPTIONS = [
  { label: 'Referral Created', value: 'referral.created' },
  { label: 'Referral Converted', value: 'referral.converted' },
];

export const newReferralEvent = createTrigger({
  auth: promotekitAuth,
  name: 'new_referral_event',
  displayName: 'New Referral Event',
  description: 'Triggers when a PromoteKit referral webhook event is received.',
  props: {
    eventTypes: Property.StaticMultiSelectDropdown({
      displayName: 'Referral Event Types',
      description:
        'Select the referral event types to listen for. Leave empty to receive all referral events.',
      required: false,
      options: { options: REFERRAL_EVENT_OPTIONS },
    }),
    instructions: Property.MarkDown({
      value: `### Setup Instructions

1. Go to your PromoteKit dashboard
2. Navigate to **Settings > Webhooks**
3. Click **Add Endpoint**
4. Paste the webhook URL shown below
5. Enable the referral event types you selected above
6. Save the endpoint

**Need different flows for different events?** Create a separate flow with its own webhook URL, and add a new endpoint in PromoteKit for that flow with only the matching event enabled.`,
    }),
  },
  sampleData: {
    type: 'referral.created',
    id: 'ref_sample',
    email: 'referral@example.com',
    subscription_status: null,
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
    const selected: string[] = context.propsValue.eventTypes ?? [];
    const isReferral =
      payload.type === 'referral.created' ||
      payload.type === 'referral.converted';
    if (!isReferral) return [];
    if (selected.length > 0 && !selected.includes(payload.type)) return [];
    return [{ type: payload.type, ...promotekitCommon.flattenReferral(payload.data) }];
  },

  async test(context) {
    const response = await promotekitApiCall<{ data: Record<string, unknown>[] }>({
      token: context.auth.secret_text,
      method: HttpMethod.GET,
      path: '/referrals',
      queryParams: { limit: '5' },
    });
    const selected: string[] = context.propsValue.eventTypes ?? [];
    const eventType = selected[0] ?? 'referral.created';
    return response.body.data.map((item) => ({
      type: eventType,
      ...promotekitCommon.flattenReferral(item),
    }));
  },
});
