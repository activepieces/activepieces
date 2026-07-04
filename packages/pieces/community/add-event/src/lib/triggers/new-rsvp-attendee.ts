import {
  DedupeStrategy,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import {
  AppConnectionValueForAuthProperty,
  createTrigger,
  StaticPropsValue,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { addEventAuth } from '../auth';
import { addEventApi } from '../common/client';
import { addEventProps } from '../common/props';
import { AddEventRsvpAttendee } from '../common/types';

const props = {
  event_id: addEventProps.eventId({ required: true }),
};

const polling: Polling<
  AppConnectionValueForAuthProperty<typeof addEventAuth>,
  StaticPropsValue<typeof props>
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue, lastFetchEpochMS }) => {
    if (!propsValue.event_id) {
      return [];
    }
    const rsvps = await addEventApi.getItemsSince<AddEventRsvpAttendee>({
      apiKey: auth.secret_text,
      resourceUri: '/rsvps',
      select: (page) => page.rsvps ?? [],
      getCreated: (rsvp) => rsvp.created,
      sinceEpochMs: lastFetchEpochMS,
      query: { event_ids: [propsValue.event_id] },
    });
    return rsvps.map((rsvp) => ({
      epochMilliSeconds: addEventApi.toEpochMs(rsvp.created),
      data: rsvp,
    }));
  },
};

export const addEventNewRsvpAttendeeTrigger = createTrigger({
  auth: addEventAuth,
  name: 'new_rsvp_attendee',
  displayName: 'New RSVP Attendee',
  description: 'Triggers when a new attendee RSVPs to your AddEvent event.',
  aiMetadata: {
    description:
      'Fires when a new attendee RSVPs to a specific AddEvent event, representing one RSVP response (going, maybe, or not-going) from a person. Scoped to the single event identified by the configured event ID.',
  },
  type: TriggerStrategy.POLLING,
  props,
  sampleData: {
    id: 'rsvp_abc123',
    event_id: 'evt_abc123',
    email: 'jane@example.com',
    attending: 'going',
    rsvp_form_data: { name: 'Jane Doe' },
    rsvp_form_labels: { name: 'Name' },
    geo_location: {
      ip: '203.0.113.10',
      city: 'Austin',
      region: 'Texas',
      country: 'United States',
      location: '30.2672,-97.7431',
      postal: '73301',
    },
    created: '2026-06-01 10:14:32',
    modified: '2026-06-01 10:14:32',
  },
  async onEnable(context) {
    await pollingHelper.onEnable(polling, context);
  },
  async onDisable(context) {
    await pollingHelper.onDisable(polling, context);
  },
  async test(context) {
    return await pollingHelper.test(polling, context);
  },
  async run(context) {
    return await pollingHelper.poll(polling, context);
  },
});
