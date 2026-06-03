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
  calendar_id: addEventProps.calendarId({ required: false }),
};

const polling: Polling<
  AppConnectionValueForAuthProperty<typeof addEventAuth>,
  StaticPropsValue<typeof props>
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue }) => {
    const response = await addEventApi.call<AddEventPage>({
      apiKey: auth.secret_text,
      method: HttpMethod.GET,
      resourceUri: '/subscribers',
      query: {
        calendar_ids: propsValue.calendar_id
          ? [propsValue.calendar_id]
          : undefined,
        page_size: addEventApi.maxPageSize,
        sort_by: 'created',
        sort_order: 'desc',
      },
    });
    const subscribers = response.subscribers ?? [];
    return subscribers.map((subscriber) => ({
      epochMilliSeconds: new Date(
        subscriber.created.replace(' ', 'T')
      ).getTime(),
      data: subscriber,
    }));
  },
};

export const addEventNewCalendarSubscriberTrigger = createTrigger({
  auth: addEventAuth,
  name: 'new_calendar_subscriber',
  displayName: 'New Calendar Subscriber',
  description:
    'Triggers when a new subscriber is added to your AddEvent calendar. Leave the calendar blank to watch all of them.',
  type: TriggerStrategy.POLLING,
  props,
  sampleData: {
    id: 'sub_abc123',
    calendar_id: 'cal_abc123',
    subscriber_status: 'active',
    calendar_type: 'google',
    sync_count: 3,
    synced: '2026-06-01 10:15:00',
    subscriber_form_data: { name: 'Jane Doe', email: 'jane@example.com' },
    subscriber_form_labels: { name: 'Name', email: 'Email' },
    geo_location: {
      ip: '203.0.113.10',
      city: 'Austin',
      region: 'Texas',
      country: 'United States',
      location: '30.2672,-97.7431',
      postal: '73301',
    },
    created: '2026-06-01 10:14:32',
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
