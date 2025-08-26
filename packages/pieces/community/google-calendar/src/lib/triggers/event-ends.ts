import {
  createTrigger,
  PiecePropValueSchema,
  Property,
} from '@activepieces/pieces-framework';
import { TriggerStrategy } from '@activepieces/pieces-framework';
import { googleCalendarCommon } from '../common';
import { GoogleCalendarEvent } from '../common/types';
import { googleCalendarAuth } from '../../';
import {
  DedupeStrategy,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import {
  AuthenticationType,
  httpClient,
  HttpMethod,
  HttpRequest,
} from '@activepieces/pieces-common';

interface GoogleCalendarEventList {
  items: GoogleCalendarEvent[];
}

const polling: Polling<
  PiecePropValueSchema<typeof googleCalendarAuth>,
  {
    calendar_id: string | undefined;
    specific_event: boolean | undefined;
    event_id: string | undefined;
  }
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue, lastFetchEpochMS }) => {
    if (lastFetchEpochMS === 0) {
      return [];
    }

    const { calendar_id: calendarId, specific_event, event_id } = propsValue;

    if (!calendarId) {
      return [];
    }

    if (specific_event && !event_id) {
      return [];
    }

    let events: GoogleCalendarEvent[] = [];

    if (specific_event && event_id) {
      const eventRequest: HttpRequest = {
        method: HttpMethod.GET,
        url: `${googleCalendarCommon.baseUrl}/calendars/${calendarId}/events/${event_id}`,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: auth.access_token,
        },
      };

      try {
        const eventResponse = await httpClient.sendRequest<GoogleCalendarEvent>(
          eventRequest
        );
        const event = eventResponse.body;

        const endTimeString = event.end?.dateTime ?? event.end?.date;
        if (endTimeString) {
          const endTime = new Date(endTimeString).getTime();
          if (endTime > lastFetchEpochMS) {
            events = [event];
          }
        }
      } catch (error) {
        console.error('Error fetching specific event:', error);
        return [];
      }
    } else {
      const request: HttpRequest = {
        method: HttpMethod.GET,
        url: `${googleCalendarCommon.baseUrl}/calendars/${calendarId}/events`,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: auth.access_token,
        },
        queryParams: {
          singleEvents: 'true',
          orderBy: 'startTime',
          timeMin: new Date(lastFetchEpochMS).toISOString(),
        },
      };

      const response = await httpClient.sendRequest<GoogleCalendarEventList>(
        request
      );
      events = response.body.items;
    }
    const endedEvents: {
      epochMilliSeconds: number;
      data: GoogleCalendarEvent;
    }[] = [];
    const now = Date.now();

    for (const event of events) {
      const endTimeString = event.end?.dateTime ?? event.end?.date;
      if (!endTimeString) continue;

      const endTime = new Date(endTimeString).getTime();

      if (endTime > lastFetchEpochMS && endTime <= now) {
        endedEvents.push({
          epochMilliSeconds: endTime,
          data: event,
        });
      }
    }

    return endedEvents;
  },
};

export const eventEnds = createTrigger({
  auth: googleCalendarAuth,
  name: 'event_ends',
  displayName: 'Event Ends',
  description: 'Fires when an event ends.',
  props: {
    calendar_id: googleCalendarCommon.calendarDropdown('writer'),
    specific_event: Property.Checkbox({
      displayName: 'Target Specific Event',
      description:
        'Enable to monitor a specific event instead of all events in the calendar.',
      required: false,
      defaultValue: false,
    }),
    event_id: googleCalendarCommon.eventDropdown(false),
  },
  type: TriggerStrategy.POLLING,
  sampleData: {
    kind: 'calendar#event',
    etag: '"3419997894982000"',
    id: 'sample_event_id_67890',
    status: 'confirmed',
    htmlLink:
      'https://www.google.com/calendar/event?eid=c2FtcGxlX2V2ZW50X2lkXzY3ODkw',
    created: '2025-08-14T09:00:00.000Z',
    updated: '2025-08-14T09:00:00.000Z',
    summary: 'Project Deadline',
    creator: { email: 'manager@example.com' },
    organizer: {
      email: 'manager@example.com',
      self: true,
    },
    start: {
      dateTime: '2025-08-14T14:30:00+05:30',
      timeZone: 'Asia/Kolkata',
    },
    end: {
      dateTime: '2025-08-14T15:30:00+05:30',
      timeZone: 'Asia/Kolkata',
    },
    iCalUID: 'sample_event_id_67890@google.com',
    sequence: 0,
    reminders: { useDefault: true },
    eventType: 'default',
  },

  async onEnable(context) {
    await pollingHelper.onEnable(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
    });
  },

  async onDisable(context) {
    await pollingHelper.onDisable(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
    });
  },

  async run(context) {
    return await pollingHelper.poll(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
      files: context.files,
    });
  },

  async test(context) {
    return await pollingHelper.test(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
      files: context.files,
    });
  },
});
