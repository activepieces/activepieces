import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { savvyCalApiCall, verifyWebhookSignature, flattenEvent, buildTeamOptions, buildLinkOptions, SavvyCalEvent } from '../common';
import { savvyCalAuth } from '../../';

const CHECKOUT_TYPES = [
  { label: 'Checkout Pending', value: 'event.checkout.pending' },
  { label: 'Checkout Expired', value: 'event.checkout.expired' },
  { label: 'Checkout Completed', value: 'event.checkout.completed' },
];

const SAMPLE_DATA = {
  event_type: 'event.checkout.completed',
  id: 'evt_abc123',
  uuid: '550e8400-e29b-41d4-a716-446655440000',
  state: 'confirmed',
  start_at: '2024-06-01T10:00:00Z',
  end_at: '2024-06-01T10:30:00Z',
  duration_minutes: 30,
  scheduling_link_id: 'lnk_xyz789',
  scheduling_link_name: '30-Minute Meeting',
  scheduling_link_slug: '30min',
  attendee_email: 'jane@example.com',
  payment_state: 'paid',
  payment_amount_total_cents: 5000,
};

export const newCheckoutTrigger = createTrigger({
  auth: savvyCalAuth,
  name: 'new_checkout',
  displayName: 'New Checkout',
  description: 'Triggers when a checkout event occurs in SavvyCal (payment pending, expired, or completed).',
  props: {
    event_types: Property.StaticMultiSelectDropdown({
      displayName: 'Checkout Types',
      description: 'Select which checkout event types to trigger on. Leave empty to trigger on all checkout types.',
      required: false,
      options: { options: CHECKOUT_TYPES },
    }),
    team_id: Property.Dropdown({
      auth: savvyCalAuth,
      displayName: 'Team',
      description: 'Filter scheduling links by team. Leave empty to show all teams.',
      refreshers: [],
      required: false,
      options: async ({ auth }) => {
        if (!auth) return { disabled: true, options: [], placeholder: 'Please connect your account first' };
        try {
          const options = await buildTeamOptions(auth.secret_text);
          return { disabled: false, options };
        } catch {
          return { disabled: true, options: [], placeholder: 'Failed to load teams.' };
        }
      },
    }),
    link_ids: Property.MultiSelectDropdown({
      auth: savvyCalAuth,
      displayName: 'Scheduling Links',
      description: 'Only trigger for events on the selected scheduling links. Leave empty to trigger for all links.',
      refreshers: ['team_id'],
      required: false,
      options: async ({ auth, team_id }) => {
        if (!auth) return { disabled: true, options: [], placeholder: 'Please connect your account first' };
        try {
          const options = await buildLinkOptions(auth.secret_text, team_id as string | null);
          return { disabled: false, options };
        } catch {
          return { disabled: true, options: [], placeholder: 'Failed to load scheduling links.' };
        }
      },
    }),
  },
  sampleData: SAMPLE_DATA,
  type: TriggerStrategy.WEBHOOK,

  async onEnable(context) {
    const response = await savvyCalApiCall<{ id: string; secret: string }>({
      token: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/webhooks',
      body: { url: context.webhookUrl },
    });
    await context.store.put('webhookId', response.body.id);
    await context.store.put('webhookSecret', response.body.secret);
  },

  async onDisable(context) {
    const webhookId = await context.store.get<string>('webhookId');
    if (webhookId) {
      await savvyCalApiCall({
        token: context.auth.secret_text,
        method: HttpMethod.DELETE,
        path: `/webhooks/${webhookId}`,
      });
    }
  },

  async run(context) {
    const secret = await context.store.get<string>('webhookSecret');
    const signature = context.payload.headers['x-savvycal-signature'] as string | undefined;
    if (secret && (!signature || !verifyWebhookSignature(secret, signature, context.payload.rawBody))) {
      return [];
    }

    const body = context.payload.body as { type: string; payload: SavvyCalEvent };
    if (!body?.payload) return [];

    if (!CHECKOUT_TYPES.some((t) => t.value === body.type)) return [];

    const selectedTypes = context.propsValue.event_types as string[] | undefined;
    if (selectedTypes && selectedTypes.length > 0 && !selectedTypes.includes(body.type)) return [];

    const selectedLinkIds = context.propsValue.link_ids as string[] | undefined;
    const linkId = body.payload?.link?.id;
    if (selectedLinkIds && selectedLinkIds.length > 0 && linkId != null && !selectedLinkIds.includes(linkId)) return [];

    return [{ event_type: body.type, ...flattenEvent(body.payload) }];
  },

  async test(_context) {
    return [SAMPLE_DATA];
  },
});
