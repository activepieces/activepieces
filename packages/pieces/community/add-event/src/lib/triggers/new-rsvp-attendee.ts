import {
  DedupeStrategy,
  HttpMethod,
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
import { AddEventPage } from '../common/types';

const props = {
  event_id: addEventProps.eventId({ required: true }),
};

const polling: Polling<
  AppConnectionValueForAuthProperty<typeof addEventAuth>,
  StaticPropsValue<typeof props>
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue }) => {
    if (!propsValue.event_id) {
      return [];
    }
    const response = await addEventApi.call<AddEventPage>({
      apiKey: auth.secret_text,
      method: HttpMethod.GET,
      resourceUri: '/rsvps',
      query: {
        event_ids: [propsValue.event_id],
        page_size: addEventApi.maxPageSize,
        sort_by: 'created',
        sort_order: 'desc',
      },
    });
    const rsvps = response.rsvps ?? [];
    return rsvps.map((rsvp) => ({
      epochMilliSeconds: new Date(rsvp.created.replace(' ', 'T')).getTime(),
      data: rsvp,
    }));
  },
};

export const addEventNewRsvpAttendeeTrigger = createTrigger({
  auth: addEventAuth,
  name: 'new_rsvp_attendee',
  displayName: 'New RSVP Attendee',
  description: 'Triggers when a new attendee RSVPs to your AddEvent event.',
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
