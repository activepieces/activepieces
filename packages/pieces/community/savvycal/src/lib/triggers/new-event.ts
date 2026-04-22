import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { savvyCalApiCall, flattenEvent, buildTeamOptions, buildLinkOptions, verifyWebhookSignature, SavvyCalEvent } from '../common';
import { savvyCalAuth } from '../../';

const EVENT_TYPES = [
  { label: 'Event Created', value: 'event.created' },
  { label: 'Event Requested', value: 'event.requested' },
  { label: 'Event Approved', value: 'event.approved' },
  { label: 'Event Declined', value: 'event.declined' },
  { label: 'Event Rescheduled', value: 'event.rescheduled' },
  { label: 'Event Changed', value: 'event.changed' },
  { label: 'Event Canceled', value: 'event.canceled' },
];

export const newEventTrigger = createTrigger({
  auth: savvyCalAuth,
  name: 'new_event',
  displayName: 'New Event',
  description: 'Triggers when a SavvyCal event occurs. Select one or more event types, or leave empty to trigger on all types.',
  props: {
    event_types: Property.StaticMultiSelectDropdown({
      displayName: 'Event Types',
      description: 'Select which event types to trigger on. Leave empty to trigger on all event types.',
      required: false,
      options: {
        options: EVENT_TYPES,
      },
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
  sampleData: {
    event_type: 'event.created',
    id: 'evt_abc123',
    uuid: '550e8400-e29b-41d4-a716-446655440000',
    summary: '30 Minute Meeting with Jane Doe',
    description: null,
    state: 'confirmed',
    start_at: '2024-06-01T10:00:00Z',
    end_at: '2024-06-01T10:30:00Z',
    duration_minutes: 30,
    url: 'https://savvycal.com/events/evt_abc123',
    location: null,
    is_group_session: false,
    created_at: '2024-05-20T08:00:00Z',
    canceled_at: null,
    cancel_reason: null,
    rescheduled_at: null,
    reschedule_reason: null,
    original_start_at: null,
    original_end_at: null,
    scheduling_link_id: 'lnk_xyz789',
    scheduling_link_name: '30-Minute Meeting',
    scheduling_link_slug: '30min',
    attendee_display_name: 'Jane Doe',
    attendee_first_name: 'Jane',
    attendee_last_name: 'Doe',
    attendee_email: 'jane@example.com',
    attendee_phone: null,
    attendee_time_zone: 'America/Chicago',
    organizer_display_name: 'John Smith',
    organizer_first_name: 'John',
    organizer_last_name: 'Smith',
    organizer_email: 'john@company.com',
    conferencing_type: 'zoom',
    conferencing_join_url: 'https://zoom.us/j/123456789',
    conferencing_meeting_id: '123456789',
    payment_state: null,
    payment_amount_total_cents: null,
  },
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

    // Guard: only handle the 7 pure event.* types — checkout/attendee/poll/workflow
    // payloads have different structures and are handled by their own dedicated triggers.
    const PURE_EVENT_VALUES = EVENT_TYPES.map((t) => t.value);
    if (!PURE_EVENT_VALUES.includes(body.type)) return [];

    const selectedTypes = context.propsValue.event_types as string[] | undefined;
    if (selectedTypes && selectedTypes.length > 0 && !selectedTypes.includes(body.type)) return [];

    const selectedLinkIds = context.propsValue.link_ids as string[] | undefined;
    const linkId = body.payload?.link?.id;
    if (selectedLinkIds && selectedLinkIds.length > 0 && linkId !== undefined && !selectedLinkIds.includes(linkId)) return [];

    const payload = flattenEvent(body.payload);
    return [{ event_type: body.type, ...payload }];
  },

  async test(context) {
    const PURE_EVENT_VALUES = EVENT_TYPES.map((t) => t.value);
    const selectedTypes = context.propsValue.event_types as string[] | undefined;
    const hasOnlyNonPureTypes = selectedTypes && selectedTypes.length > 0 && selectedTypes.every((t) => !PURE_EVENT_VALUES.includes(t));
    if (hasOnlyNonPureTypes) return [];

    const selectedLinkIds = context.propsValue.link_ids as string[] | undefined;
    const queryParams: Record<string, string> = { limit: '10' };
    if (selectedLinkIds && selectedLinkIds.length === 1) queryParams['link_id'] = selectedLinkIds[0];

    const response = await savvyCalApiCall<{ entries: SavvyCalEvent[] }>({
      token: context.auth.secret_text,
      method: HttpMethod.GET,
      path: '/events',
      queryParams,
    });
    const events = selectedLinkIds && selectedLinkIds.length > 1
      ? response.body.entries.filter((e) => selectedLinkIds.includes(e.link?.id ?? ''))
      : response.body.entries;
    return events.slice(0, 5).map((e) => ({ event_type: 'event.created', ...flattenEvent(e) }));
  },
});
