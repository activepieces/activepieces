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
  {
    calendarId?: string;
    expandRecurringEvent: boolean;
    reminderMinutes: number;
  }
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({
    auth,
    propsValue: { calendarId, expandRecurringEvent, reminderMinutes },
    lastFetchEpochMS,
  }) => {
    const now = new Date();
    const currentTime = now.getTime();

    const pastTime = new Date(
      Math.max(lastFetchEpochMS, currentTime - 60 * 60 * 1000)
    );

    const currentValues: GoogleCalendarEvent[] =
      (await getEvents(
        calendarId || '',
        expandRecurringEvent,
        auth,
        pastTime
      )) ?? [];

    const reminderEvents = currentValues.filter((event) => {
      if (event.status === 'cancelled') return false;

      const startTime = new Date(
        event.start?.dateTime || event.start?.date
      ).getTime();
      const reminderTime = startTime - reminderMinutes * 60 * 1000;

      return (
        reminderTime <= currentTime &&
        reminderTime > lastFetchEpochMS &&
        startTime > currentTime
      ); // Event hasn't started yet
    });

    const items = reminderEvents.map((item) => ({
      epochMilliSeconds:
        new Date(item.start?.dateTime || item.start?.date).getTime() -
        reminderMinutes * 60 * 1000,
      data: {
        ...item,
        reminderInfo: {
          minutesBeforeStart: reminderMinutes,
          reminderTime: new Date(
            new Date(item.start?.dateTime || item.start?.date).getTime() -
              reminderMinutes * 60 * 1000
          ).toISOString(),
          eventStartTime: item.start?.dateTime || item.start?.date,
        },
      },
    }));

    return items;
  },
};

export const eventStartReminder = createTrigger({
  auth: googleCalendarAuth,
  name: 'event_start_reminder',
  displayName: 'Event Start (Time Before)',
  description:
    'Fires at a specified amount of time before an event starts (e.g., a reminder)',
  props: {
    calendar_id: googleCalendarCommon.calendarDropdown(),
    reminderMinutes: Property.Number({
      displayName: 'Minutes Before Event',
      description:
        'Number of minutes before the event starts to trigger this reminder',
      required: true,
      defaultValue: 15,
    }),
    expandRecurringEvent: Property.Checkbox({
      displayName: 'Expand Recurring Event?',
      description:
        'If true, the trigger will activate for every occurrence of a recurring event.',
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
    summary: 'Upcoming Meeting',
    created: '2023-02-03T11:36:36.000Z',
    updated: '2023-02-03T11:45:53.487Z',
    description: 'Meeting starting soon',
    status: 'confirmed',
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
    reminderInfo: {
      minutesBeforeStart: 15,
      reminderTime: '2023-02-02T22:15:00+03:00',
      eventStartTime: '2023-02-02T22:30:00+03:00',
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
        reminderMinutes: propsValue.reminderMinutes,
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
        reminderMinutes: propsValue.reminderMinutes,
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
        reminderMinutes: propsValue.reminderMinutes,
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
        reminderMinutes: propsValue.reminderMinutes,
      },
      files,
    });
  },
});
