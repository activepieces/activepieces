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
    search_term: string | undefined;
    event_types: string[] | undefined;
    search_fields: string[] | undefined;
  }
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue, lastFetchEpochMS }) => {
    const { calendar_id, search_term, event_types, search_fields } = propsValue;

    if (!calendar_id || !search_term) {
      return [];
    }

    let minUpdated: Date;
    if (lastFetchEpochMS === 0) {
      minUpdated = new Date();
      minUpdated.setDate(minUpdated.getDate() - 1);
    } else {
      minUpdated = new Date(lastFetchEpochMS);
    }

    const queryParams: Record<string, string> = {
      singleEvents: 'true',
      orderBy: 'updated',
      updatedMin: minUpdated.toISOString(),
      q: search_term,
    };

    if (event_types && event_types.length > 0) {
      event_types.forEach((type) => {
        if (!queryParams.eventTypes) {
          queryParams.eventTypes = type;
        } else {
          queryParams.eventTypes += '&eventTypes=' + type;
        }
      });
    }

    const request: HttpRequest = {
      method: HttpMethod.GET,
      url: `${googleCalendarCommon.baseUrl}/calendars/${calendar_id}/events`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth.access_token,
      },
      queryParams: queryParams,
    };

    const response = await httpClient.sendRequest<GoogleCalendarEventList>(
      request
    );
    const events = response.body.items;

    const newEvents = events.filter((event) => {
      const created = new Date(event.created ?? 0).getTime();
      const updated = new Date(event.updated ?? 0).getTime();

      const isNewEvent = updated - created < 5000;

      if (!isNewEvent) return false;

      if (search_fields && search_fields.length > 0) {
        const searchTermLower = search_term.toLowerCase();
        return search_fields.some((field) => {
          switch (field) {
            case 'summary':
              return (
                event.summary?.toLowerCase().includes(searchTermLower) || false
              );
            case 'description':
              return (
                event.description?.toLowerCase().includes(searchTermLower) ||
                false
              );
            case 'location':
              return (
                event.location?.toLowerCase().includes(searchTermLower) || false
              );
            case 'attendees':
              return (
                event.attendees?.some(
                  (attendee) =>
                    attendee.email?.toLowerCase().includes(searchTermLower) ||
                    attendee.displayName
                      ?.toLowerCase()
                      .includes(searchTermLower)
                ) || false
              );
            default:
              return false;
          }
        });
      }

      return true;
    });

    return newEvents.map((event) => {
      return {
        epochMilliSeconds: new Date(event.updated!).getTime(),
        data: event,
      };
    });
  },
};

export const newEventMatchingSearch = createTrigger({
  auth: googleCalendarAuth,
  name: 'new_event_matching_search',
  displayName: 'New Event Matching Search',
  description:
    'Fires when a new event is created that matches a specified search term.',
  props: {
    calendar_id: googleCalendarCommon.calendarDropdown('writer'),
    search_term: Property.ShortText({
      displayName: 'Search Term',
      description:
        'The keyword(s) to search for in new events (searches across title, description, location, and attendees by default).',
      required: true,
    }),
    event_types: Property.StaticMultiSelectDropdown({
      displayName: 'Event Types',
      description: 'Filter by specific event types (optional)',
      required: false,
      options: {
        options: [
          { label: 'Default Events', value: 'default' },
          { label: 'Birthday Events', value: 'birthday' },
          { label: 'Focus Time', value: 'focusTime' },
          { label: 'Out of Office', value: 'outOfOffice' },
          { label: 'Working Location', value: 'workingLocation' },
          { label: 'From Gmail', value: 'fromGmail' },
        ],
      },
    }),
    search_fields: Property.StaticMultiSelectDropdown({
      displayName: 'Search In Fields',
      description:
        "Specify which fields to search in (leave empty to use Google's default search across all fields)",
      required: false,
      options: {
        options: [
          { label: 'Event Title/Summary', value: 'summary' },
          { label: 'Event Description', value: 'description' },
          { label: 'Event Location', value: 'location' },
          { label: 'Attendee Names/Emails', value: 'attendees' },
        ],
      },
    }),
  },
  type: TriggerStrategy.POLLING,
  sampleData: {
    id: 'abc123def456',
    summary: 'Final Project Review',
    description: 'Review of the Q3 final project deliverables.',
    status: 'confirmed',
    created: '2025-08-14T09:05:00.000Z',
    updated: '2025-08-14T09:05:01.000Z',
    start: { dateTime: '2025-09-01T10:00:00-07:00' },
    end: { dateTime: '2025-09-01T11:30:00-07:00' },
    organizer: { email: 'project.manager@example.com' },
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
