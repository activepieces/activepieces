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
    searchKeyword?: string;
    searchInTitle: boolean;
    searchInDescription: boolean;
    searchInLocation: boolean;
  }
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({
    auth,
    propsValue: {
      calendarId,
      expandRecurringEvent,
      searchKeyword,
      searchInTitle,
      searchInDescription,
      searchInLocation,
    },
    lastFetchEpochMS,
  }) => {
    let minCreated = new Date(lastFetchEpochMS);

    if (lastFetchEpochMS === 0) {
      const now = new Date();
      const yesterday = new Date();
      yesterday.setDate(now.getDate() - 1);
      minCreated = yesterday;
    }

    const currentValues: GoogleCalendarEvent[] =
      (await getEvents(
        calendarId || '',
        expandRecurringEvent,
        auth,
        minCreated
      )) ?? [];

    let newEvents = currentValues.filter((event) => {
      const createdTime = new Date(event.created).getTime();
      return createdTime >= lastFetchEpochMS && event.status !== 'cancelled';
    });

    if (searchKeyword && searchKeyword.trim()) {
      const keyword = searchKeyword.toLowerCase().trim();

      newEvents = newEvents.filter((event) => {
        let matches = false;

        if (searchInTitle && event.summary) {
          matches = matches || event.summary.toLowerCase().includes(keyword);
        }

        if (searchInDescription && event.description) {
          matches =
            matches || event.description.toLowerCase().includes(keyword);
        }

        if (searchInLocation && event.location) {
          matches = matches || event.location.toLowerCase().includes(keyword);
        }

        return matches;
      });
    }

    const items = newEvents.map((item) => ({
      epochMilliSeconds: new Date(item.created).getTime(),
      data: {
        ...item,
        searchInfo: {
          matchedKeyword: searchKeyword,
          searchCriteria: {
            searchInTitle,
            searchInDescription,
            searchInLocation,
          },
        },
      },
    }));

    return items;
  },
};

export const newEventMatchingSearch = createTrigger({
  auth: googleCalendarAuth,
  name: 'new_event_matching_search',
  displayName: 'New Event Matching Search',
  description:
    'Fires when a new event matches specified keyword or search filters',
  props: {
    calendar_id: googleCalendarCommon.calendarDropdown(),
    searchKeyword: Property.ShortText({
      displayName: 'Search Keyword',
      description: 'Keyword to search for in event details',
      required: true,
    }),
    searchInTitle: Property.Checkbox({
      displayName: 'Search in Title',
      description: 'Include event title/summary in search',
      required: true,
      defaultValue: true,
    }),
    searchInDescription: Property.Checkbox({
      displayName: 'Search in Description',
      description: 'Include event description in search',
      required: true,
      defaultValue: true,
    }),
    searchInLocation: Property.Checkbox({
      displayName: 'Search in Location',
      description: 'Include event location in search',
      required: true,
      defaultValue: true,
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
    summary: 'Team Meeting - Project Review',
    created: '2023-02-03T11:36:36.000Z',
    updated: '2023-02-03T11:36:36.000Z',
    description: 'Weekly team meeting to review project progress',
    location: 'Conference Room A',
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
    sequence: 0,
    searchInfo: {
      matchedKeyword: 'meeting',
      searchCriteria: {
        searchInTitle: true,
        searchInDescription: true,
        searchInLocation: false,
      },
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
        searchKeyword: propsValue.searchKeyword,
        searchInTitle: propsValue.searchInTitle,
        searchInDescription: propsValue.searchInDescription,
        searchInLocation: propsValue.searchInLocation,
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
        searchKeyword: propsValue.searchKeyword,
        searchInTitle: propsValue.searchInTitle,
        searchInDescription: propsValue.searchInDescription,
        searchInLocation: propsValue.searchInLocation,
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
        searchKeyword: propsValue.searchKeyword,
        searchInTitle: propsValue.searchInTitle,
        searchInDescription: propsValue.searchInDescription,
        searchInLocation: propsValue.searchInLocation,
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
        searchKeyword: propsValue.searchKeyword,
        searchInTitle: propsValue.searchInTitle,
        searchInDescription: propsValue.searchInDescription,
        searchInLocation: propsValue.searchInLocation,
      },
      files,
    });
  },
});
