import {
  createTrigger,
  PiecePropValueSchema,
} from '@activepieces/pieces-framework';
import { TriggerStrategy } from '@activepieces/pieces-framework';
import { getCalendarsWithTimestamp } from '../common/helper';
import { CalendarObject } from '../common/types';
import { googleCalendarAuth } from '../../';
import {
  DedupeStrategy,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';

const polling: Polling<
  PiecePropValueSchema<typeof googleCalendarAuth>,
  Record<string, never>
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, lastFetchEpochMS, store }) => {
    const currentCalendars: CalendarObject[] =
      (await getCalendarsWithTimestamp(auth)) ?? [];

    const knownCalendarIds =
      (await store?.get<string[]>('known_calendar_ids')) || [];

    const newCalendars = currentCalendars.filter(
      (calendar) => !knownCalendarIds.includes(calendar.id) && !calendar.primary
    );

    const allCalendarIds = currentCalendars.map((cal) => cal.id);
    await store?.put('known_calendar_ids', allCalendarIds);

    const items = newCalendars.map((calendar) => {
      const currentTime = Date.now();

      return {
        epochMilliSeconds: Math.max(lastFetchEpochMS + 1, currentTime),
        data: {
          ...calendar,
          calendarInfo: {
            discoveredAt: new Date().toISOString(),
            calendarId: calendar.id,
            calendarName: calendar.summary,
            isPrimary: calendar.primary || false,
            accessRole: calendar.accessRole,
          },
        },
      };
    });

    if (lastFetchEpochMS === 0) {
      return [];
    }

    return items;
  },
};

export const newCalendar = createTrigger({
  auth: googleCalendarAuth,
  name: 'new_calendar',
  displayName: 'New Calendar',
  description: 'Fires when a new calendar is created',
  props: {},
  sampleData: {
    kind: 'calendar#calendarListEntry',
    etag: '1675424196974000',
    id: 'primary',
    summary: 'My New Calendar',
    description: 'A calendar for tracking project tasks',
    location: 'New York, NY',
    timeZone: 'America/New_York',
    colorId: '1',
    backgroundColor: '#ac725e',
    foregroundColor: '#1d1d1d',
    selected: true,
    accessRole: 'owner',
    defaultReminders: [
      {
        method: 'popup',
        minutes: 10,
      },
    ],
    primary: false,
    calendarInfo: {
      discoveredAt: '2023-02-03T11:36:36.000Z',
      calendarId: 'primary',
      calendarName: 'My New Calendar',
      isPrimary: false,
    },
  },
  type: TriggerStrategy.POLLING,
  async test({ store, auth, files }) {
    return await pollingHelper.test(polling, {
      store,
      auth,
      propsValue: {},
      files,
    });
  },
  async onEnable({ store, auth }) {
    await pollingHelper.onEnable(polling, {
      store,
      auth,
      propsValue: {},
    });
  },
  async onDisable({ store, auth }) {
    await pollingHelper.onDisable(polling, {
      store,
      auth,
      propsValue: {},
    });
  },
  async run({ store, auth, files }) {
    return await pollingHelper.poll(polling, {
      store,
      auth,
      propsValue: {},
      files,
    });
  },
});
