import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import {
  savvyCalApiCall,
  buildTeamOptions,
  buildLinkOptions,
  verifyWebhookSignature,
  readWebhookBody,
  unwrapEventWebhook,
  flattenEventWebhook,
  SavvyCalEvent,
} from '../common';
import { savvyCalAuth, getToken } from '../auth';

const EVENT_TYPES = [
  { label: 'Event Created', value: 'event.created' },
  { label: 'Event Requested', value: 'event.requested' },
  { label: 'Event Approved', value: 'event.approved' },
  { label: 'Event Declined', value: 'event.declined' },
  { label: 'Event Rescheduled', value: 'event.rescheduled' },
  { label: 'Event Changed', value: 'event.changed' },
  { label: 'Event Canceled', value: 'event.canceled' },
  { label: 'Checkout Pending', value: 'event.checkout.pending' },
  { label: 'Checkout Expired', value: 'event.checkout.expired' },
  { label: 'Checkout Completed', value: 'event.checkout.completed' },
  { label: 'Attendee Added', value: 'event.attendee.added' },
  { label: 'Attendee Canceled', value: 'event.attendee.canceled' },
  { label: 'Attendee Rescheduled', value: 'event.attendee.rescheduled' },
];

const EVENT_VALUES = EVENT_TYPES.map((t) => t.value);

export const newEventTrigger = createTrigger({
  auth: savvyCalAuth,
  name: 'new_event',
  classification: 'READ',
  displayName: 'New Event',
  description: 'Triggers when a SavvyCal event occurs. Select one or more event types, or leave empty to trigger on all types.',
  aiMetadata: {
    description: 'Fires when a SavvyCal booking-level event occurs via webhook — covering created, requested, approved, declined, rescheduled, changed, canceled, checkout state changes, and attendee add/cancel/reschedule. Can be scoped to specific event types and/or scheduling links, or left open to fire on every booking event. Each firing represents one such event with the affected booking\'s details, including the attendee answers to the booking questions; attendee events describe the attendee who was added, canceled, or rescheduled, and change or reschedule events carry the previous start and end times.',
  },
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
          const options = await buildTeamOptions(getToken(auth));
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
          const options = await buildLinkOptions(getToken(auth), team_id);
          return { disabled: false, options };
        } catch {
          return { disabled: true, options: [], placeholder: 'Failed to load scheduling links.' };
        }
      },
    }),
  },
  sampleData: {
    event_type: 'event.created',
    id: 'event_01KKGY70MFPCECSQ6KM6FMDPC3',
    uuid: '550e8400-e29b-41d4-a716-446655440000',
    summary: '30 Minute Meeting with Jane Doe',
    description: null,
    additional_info: 'Please prepare a project overview',
    state: 'confirmed',
    start_at: '2024-06-01T10:00:00Z',
    end_at: '2024-06-01T10:30:00Z',
    duration_minutes: 30,
    url: 'https://savvycal.com/events/550e8400-e29b-41d4-a716-446655440000',
    location: 'https://zoom.us/j/123456789',
    is_group_session: false,
    created_at: '2024-05-20T08:00:00Z',
    canceled_at: null,
    cancel_reason: null,
    rescheduled_at: null,
    reschedule_reason: null,
    original_start_at: null,
    original_end_at: null,
    scheduling_link_id: 'link_01J5KC2G3MHPCECSQ6KM6FMDPC',
    scheduling_link_name: '30 Minute Meeting',
    scheduling_link_private_name: 'Intro call',
    scheduling_link_slug: '30min',
    team_id: 'scope_01J5KC2G3MHPCECSQ6KM6FMDPC',
    team_name: 'Acme',
    team_slug: 'acme',
    poll_id: null,
    poll_name: null,
    attendee_display_name: 'Jane Doe',
    attendee_first_name: 'Jane',
    attendee_last_name: 'Doe',
    attendee_email: 'jane@example.com',
    attendee_phone: '+15555555555',
    attendee_time_zone: 'America/Chicago',
    attendee_response_status: 'accepted',
    attendee_marketing_opt_in: false,
    attendee_answers: { Company: 'Example Inc.' },
    organizer_display_name: 'John Smith',
    organizer_first_name: 'John',
    organizer_last_name: 'Smith',
    organizer_email: 'john@example.com',
    attendee_count: 1,
    attendees: [
      {
        display_name: 'John Smith',
        first_name: 'John',
        last_name: 'Smith',
        email: 'john@example.com',
        phone: null,
        time_zone: 'America/New_York',
        response_status: 'accepted',
        is_organizer: true,
      },
      {
        display_name: 'Jane Doe',
        first_name: 'Jane',
        last_name: 'Doe',
        email: 'jane@example.com',
        phone: '+15555555555',
        time_zone: 'America/Chicago',
        response_status: 'accepted',
        is_organizer: false,
      },
    ],
    conferencing_type: 'zoom',
    conferencing_join_url: 'https://zoom.us/j/123456789',
    conferencing_meeting_id: '123456789',
    conferencing_instructions: null,
    payment_state: null,
    payment_amount_total_cents: null,
    payment_url: null,
    metadata: {},
    previous_event_id: null,
    previous_start_at: null,
    previous_end_at: null,
    previous_state: null,
  },
  type: TriggerStrategy.WEBHOOK,

  async onEnable(context) {
    const response = await savvyCalApiCall<{ id: string; secret: string }>({
      token: getToken(context.auth),
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
        token: getToken(context.auth),
        method: HttpMethod.DELETE,
        path: `/webhooks/${webhookId}`,
      });
    }
  },

  async run(context) {
    const secret = await context.store.get<string>('webhookSecret');
    const signature = context.payload.headers['x-savvycal-signature'];
    if (secret && (!signature || !verifyWebhookSignature(secret, signature, context.payload.rawBody))) {
      return [];
    }

    const body = readWebhookBody(context.payload.body);
    if (!body || !EVENT_VALUES.includes(body.type)) return [];

    const selectedTypes = context.propsValue.event_types;
    if (selectedTypes && selectedTypes.length > 0 && !selectedTypes.includes(body.type)) return [];

    const unwrapped = unwrapEventWebhook({ type: body.type, payload: body.payload });
    if (!unwrapped) return [];

    const selectedLinkIds = context.propsValue.link_ids;
    const linkId = unwrapped.event.link?.id;
    if (selectedLinkIds && selectedLinkIds.length > 0 && linkId != null && !selectedLinkIds.includes(linkId)) return [];

    return [flattenEventWebhook({ type: body.type, unwrapped })];
  },

  async test(context) {
    const token = getToken(context.auth);
    const selectedLinkIds = context.propsValue.link_ids ?? [];
    const previewType = context.propsValue.event_types?.[0] ?? 'event.created';
    const baseParams: Record<string, string> = { limit: '20', state: 'any', attendance: 'any' };
    if (selectedLinkIds.length === 1) baseParams['link'] = selectedLinkIds[0];

    const past = await fetchSampleEvents({ token, queryParams: { ...baseParams, period: 'past', direction: 'desc' } });
    const events = past.length > 0 ? past : await fetchSampleEvents({ token, queryParams: { ...baseParams, period: 'upcoming' } });

    return events
      .filter((event) => selectedLinkIds.length <= 1 || selectedLinkIds.includes(event.link?.id ?? ''))
      .slice(0, 5)
      .map((event) => flattenEventWebhook({ type: previewType, unwrapped: { event, attendee: null, previous: null } }));
  },
});

async function fetchSampleEvents({ token, queryParams }: { token: string; queryParams: Record<string, string> }): Promise<SavvyCalEvent[]> {
  const response = await savvyCalApiCall<{ entries: SavvyCalEvent[] }>({
    token,
    method: HttpMethod.GET,
    path: '/events',
    queryParams,
  });
  return response.body.entries;
}
