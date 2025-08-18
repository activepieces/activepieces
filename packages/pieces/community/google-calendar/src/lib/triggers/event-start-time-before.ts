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
    time_value: number | undefined;
    time_unit: string | undefined;
  }
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue }) => {
    const { calendar_id, specific_event, event_id, time_value, time_unit } =
      propsValue;

    if (!calendar_id || !time_value || !time_unit) {
      return [];
    }

    if (specific_event && !event_id) {
      return [];
    }

    let offset_ms = time_value * 60 * 1000;
    if (time_unit === 'hours') {
      offset_ms = time_value * 60 * 60 * 1000;
    } else if (time_unit === 'days') {
      offset_ms = time_value * 24 * 60 * 60 * 1000;
    }

    const now = Date.now();

    const pollingIntervalMs = 5 * 60 * 1000;

    const timeMin = new Date(now + offset_ms).toISOString();
    const timeMax = new Date(now + offset_ms + pollingIntervalMs).toISOString();

    let events: GoogleCalendarEvent[] = [];

    if (specific_event && event_id) {
      const eventRequest: HttpRequest = {
        method: HttpMethod.GET,
        url: `${googleCalendarCommon.baseUrl}/calendars/${calendar_id}/events/${event_id}`,
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

        // Check if this specific event falls within our time window
        const eventStartTime = new Date(
          event.start?.dateTime ?? event.start?.date ?? 0
        ).getTime();
        const triggerTime = eventStartTime - offset_ms;

        if (triggerTime >= now && triggerTime <= now + pollingIntervalMs) {
          events = [event];
        }
      } catch (error) {
        console.error('Error fetching specific event:', error);
        return [];
      }
    } else {
      const request: HttpRequest = {
        method: HttpMethod.GET,
        url: `${googleCalendarCommon.baseUrl}/calendars/${calendar_id}/events`,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: auth.access_token,
        },
        queryParams: {
          singleEvents: 'true',
          orderBy: 'startTime',
          timeMin: timeMin,
          timeMax: timeMax,
        },
      };

      const response = await httpClient.sendRequest<GoogleCalendarEventList>(
        request
      );
      events = response.body.items;
    }

    return events.map((event) => {
      const startTime = new Date(
        event.start?.dateTime ?? event.start?.date ?? 0
      ).getTime();

      const triggerTime = startTime - offset_ms;
      return {
        epochMilliSeconds: triggerTime,
        data: event,
      };
    });
  },
};

export const eventStartTimeBefore = createTrigger({
  auth: googleCalendarAuth,
  name: 'event_starts_in',
  displayName: 'Event Start (Time Before)',
  description:
    'Fires at a specified amount of time before an event starts (e.g., a reminder).',
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
    time_value: Property.Number({
      displayName: 'Time Before',
      description: 'The amount of time before the event starts.',
      required: true,
      defaultValue: 15,
    }),
    time_unit: Property.StaticDropdown({
      displayName: 'Time Unit',
      required: true,
      options: {
        options: [
          { label: 'Minutes', value: 'minutes' },
          { label: 'Hours', value: 'hours' },
          { label: 'Days', value: 'days' },
        ],
      },
      defaultValue: 'minutes',
    }),
  },
  type: TriggerStrategy.POLLING,
  sampleData: {},

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
