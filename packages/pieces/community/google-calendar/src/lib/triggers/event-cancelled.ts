import {
  createTrigger,
  PiecePropValueSchema,
  Property,
} from '@activepieces/pieces-framework';
import { TriggerStrategy } from '@activepieces/pieces-framework';
import { googleCalendarCommon } from '../common';
import { getEvents } from '../common/helper';
import { GoogleCalendarEvent } from '../common/types';
import { googleCalendarAuth } from '../../';
import {
  DedupeStrategy,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';

const polling: Polling<
  PiecePropValueSchema<typeof googleCalendarAuth>,
  { calendarId?: string; expandRecurringEvent: boolean }
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({
    auth,
    propsValue: { calendarId, expandRecurringEvent },
    lastFetchEpochMS,
  }) => {
    let minUpdated = new Date(lastFetchEpochMS);

    if (lastFetchEpochMS === 0) {
      const now = new Date();
      const yesterday = new Date();
      yesterday.setDate(now.getDate() - 7);
      minUpdated = yesterday;
    }

    const currentValues: GoogleCalendarEvent[] =
      (await getEvents(
        calendarId || '',
        expandRecurringEvent,
        auth,
        minUpdated
      )) ?? [];

    const cancelledEvents = currentValues.filter((event) => {
      const updatedTime = new Date(event.updated).getTime();
      return event.status === 'cancelled' && updatedTime >= lastFetchEpochMS;
    });

    const items = cancelledEvents.map((item) => ({
      epochMilliSeconds: new Date(item.updated).getTime(),
      data: {
        ...item,
        cancellationInfo: {
          cancelledAt: item.updated,
          eventId: item.id,
          originalSummary: item.summary,
        },
      },
    }));

    return items;
  },
};

export const eventCancelled = createTrigger({
  auth: googleCalendarAuth,
  name: 'event_cancelled',
  displayName: 'Event Cancelled',
  description: 'Fires when an event is canceled or deleted',
  props: {
    calendar_id: googleCalendarCommon.calendarDropdown(),
    expandRecurringEvent: Property.Checkbox({
      displayName: 'Expand Recurring Event?',
      description:
        'If true, the trigger will activate for every occurrence of a recurring event that is cancelled.',
      required: true,
      defaultValue: false,
    }),
  },
  sampleData: {
    kind: 'calendar#event',
    etag: '3350849506974000',
    id: '0nsfi5ttd2b17ac76ma2f37oi9',
    htmlLink:
      'https://www.google.com/calendar/event?eid=kgjb90uioj4klrgfmdsnjsjvlgkm',
    summary: 'Cancelled Meeting',
    created: '2023-02-03T11:36:36.000Z',
    updated: '2023-02-03T12:45:53.487Z',
    description: 'This meeting has been cancelled',
    status: 'cancelled',
    creator: {
      email: 'test@test.com',
      self: true,
    },
    organizer: {
      email: 'test@test.com',
      self: true,
    },
    start: {
      dateTime: '2023-02-02T22:30:00+03:00',
      timeZone: 'Asia/Amman',
    },
    end: {
      dateTime: '2023-02-02T23:30:00+03:00',
      timeZone: 'Asia/Amman',
    },
    iCalUID: '0nsfi5ttd2b17ac76ma2f37oi9@google.com',
    sequence: 1,
    cancellationInfo: {
      cancelledAt: '2023-02-03T12:45:53.487Z',
      eventId: '0nsfi5ttd2b17ac76ma2f37oi9',
      originalSummary: 'Cancelled Meeting',
    },
    reminders: {
      useDefault: true,
    },
    eventType: 'default',
  },
  type: TriggerStrategy.POLLING,
  async test({ store, auth, propsValue, files }) {
    return await pollingHelper.test(polling, {
      store,
      auth,
      propsValue: {
        calendarId: propsValue.calendar_id,
        expandRecurringEvent: propsValue.expandRecurringEvent,
      },
      files,
    });
  },
  async onEnable({ store, auth, propsValue }) {
    await pollingHelper.onEnable(polling, {
      store,
      auth,
      propsValue: {
        calendarId: propsValue.calendar_id,
        expandRecurringEvent: propsValue.expandRecurringEvent,
      },
    });
  },
  async onDisable({ store, auth, propsValue }) {
    await pollingHelper.onDisable(polling, {
      store,
      auth,
      propsValue: {
        calendarId: propsValue.calendar_id,
        expandRecurringEvent: propsValue.expandRecurringEvent,
      },
    });
  },
  async run({ store, auth, propsValue, files }) {
    return await pollingHelper.poll(polling, {
      store,
      auth,
      propsValue: {
        calendarId: propsValue.calendar_id,
        expandRecurringEvent: propsValue.expandRecurringEvent,
      },
      files,
    });
  },
});
