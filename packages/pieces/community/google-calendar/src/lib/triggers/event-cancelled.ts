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
import { getEvents } from '../common/helper';

interface GoogleCalendarEventList {
  items: GoogleCalendarEvent[];
}

const polling: Polling<
  PiecePropValueSchema<typeof googleCalendarAuth>,
  {
    calendar_id: string | undefined;
    specific_event: boolean | undefined;
    event_id: string | undefined;
    cancellation_reason: string[] | undefined;
  }
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue, lastFetchEpochMS }) => {
    const {
      calendar_id: calendarId,
      specific_event,
      event_id,
      cancellation_reason,
    } = propsValue;

    if (!calendarId) {
      return [];
    }

    if (specific_event && !event_id) {
      return [];
    }

    let minUpdated: Date;
    if (lastFetchEpochMS === 0) {
      minUpdated = new Date();
      minUpdated.setDate(minUpdated.getDate() - 1);
    } else {
      minUpdated = new Date(lastFetchEpochMS);
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

        const updatedTime = new Date(event.updated ?? 0).getTime();
        if (updatedTime > lastFetchEpochMS && event.status === 'cancelled') {
          events = [event];
        }
      } catch (error) {
        console.error('Error fetching specific event:', error);
        return [];
      }
    } else {
      const allEvents = await getEvents(calendarId, true, auth, minUpdated);
      events = allEvents.filter((event) => event.status === 'cancelled');
    }

    if (cancellation_reason && cancellation_reason.length > 0) {
      events = events.filter((event) => {
        return cancellation_reason.some((reason) => {
          switch (reason) {
            case 'deleted':
              return !event.summary || event.summary.includes('Deleted');
            case 'declined':
              return (
                event.attendees?.some(
                  (attendee) => attendee.responseStatus === 'declined'
                ) || false
              );
            case 'rescheduled':
              return (
                event.summary?.toLowerCase().includes('rescheduled') ||
                event.description?.toLowerCase().includes('rescheduled') ||
                false
              );
            case 'other':
              return true;
            default:
              return true;
          }
        });
      });
    }

    return events.map((event) => {
      return {
        epochMilliSeconds: new Date(event.updated!).getTime(),
        data: event,
      };
    });
  },
};

export const eventCancelled = createTrigger({
  auth: googleCalendarAuth,
  name: 'event_cancelled',
  displayName: 'Event Cancelled',
  description: 'Fires when an event is canceled or deleted.',
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
    cancellation_reason: Property.StaticMultiSelectDropdown({
      displayName: 'Cancellation Reasons',
      description: 'Filter by specific types of cancellations (optional)',
      required: false,
      options: {
        options: [
          { label: 'Event Deleted', value: 'deleted' },
          { label: 'Attendee Declined', value: 'declined' },
          { label: 'Event Rescheduled', value: 'rescheduled' },
          { label: 'Other Cancellations', value: 'other' },
        ],
      },
    }),
  },
  type: TriggerStrategy.POLLING,
  sampleData: {
    id: 'abc123def456_cancelled',
    summary: 'Cancelled: Q3 Planning Session',
    status: 'cancelled',
    created: '2025-07-20T10:00:00.000Z',
    updated: '2025-08-14T09:30:00.000Z',
    organizer: { email: 'project.manager@example.com' },
    start: { dateTime: '2025-08-25T10:00:00-07:00' },
    end: { dateTime: '2025-08-25T11:30:00-07:00' },
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
