import { createAction, Property } from '@activepieces/pieces-framework';
import { calendar as googleCalendar } from '@googleapis/calendar';
import {
  googleCalendarCommon,
  googleCalendarAuth,
  createGoogleClient,
} from '../common';
import dayjs from 'dayjs';

export const listRecurringEventInstances = createAction({
  auth: googleCalendarAuth,
  name: 'google_calendar_list_recurring_event_instances',
  displayName: 'List Recurring Event Instances',
  description:
    'Lists the individual occurrences of one recurring event series, each with its own instance event ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'List the individual occurrences of a single recurring event series, identified by its recurring-event ID, each returned with its own distinct instance event ID. Use this when you need to inspect, reschedule, or cancel ONE occurrence of a series rather than the whole series; Get all Events expands recurring events only across a whole-calendar window and cannot target one series by ID. Requires the recurring series\' event ID; optionally bound by a time range. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    calendar_id: googleCalendarCommon.calendarDropdown(),
    event_id: Property.ShortText({
      displayName: 'Recurring Event ID',
      description:
        'The event ID of the recurring SERIES (the parent), e.g. "abc123def456". Obtain it from Search Events Across Calendars or Get all Events. Individual instance IDs will not work here.',
      required: true,
    }),
    time_min: Property.DateTime({
      displayName: 'Start Time',
      description:
        'Optional lower bound (inclusive) for an instance\'s end time, as an ISO 8601 timestamp with offset (e.g. "2026-06-01T00:00:00Z").',
      required: false,
    }),
    time_max: Property.DateTime({
      displayName: 'End Time',
      description:
        'Optional upper bound (exclusive) for an instance\'s start time, as an ISO 8601 timestamp with offset (e.g. "2026-06-30T23:59:59Z").',
      required: false,
    }),
    show_deleted: Property.Checkbox({
      displayName: 'Include Cancelled Instances',
      description:
        'Whether to include cancelled (deleted) instances of the series in the result. Defaults to false.',
      required: false,
      defaultValue: false,
    }),
    max_results: Property.Number({
      displayName: 'Max Results',
      description:
        'Maximum number of instances to return per page (1-2500). Defaults to the API default of 250.',
      required: false,
    }),
  },
  async run(context) {
    const {
      calendar_id: calendarId,
      event_id: eventId,
      time_min,
      time_max,
      show_deleted,
      max_results,
    } = context.propsValue;

    const authClient = await createGoogleClient(context.auth);
    const calendar = googleCalendar({ version: 'v3', auth: authClient });

    try {
      const response = await calendar.events.instances({
        calendarId,
        eventId,
        timeMin: time_min ? dayjs(time_min).toISOString() : undefined,
        timeMax: time_max ? dayjs(time_max).toISOString() : undefined,
        showDeleted: show_deleted ?? false,
        maxResults: max_results,
      });

      const items = response.data.items ?? [];
      return {
        instances: items,
        count: items.length,
        nextPageToken: response.data.nextPageToken ?? null,
      };
    } catch (error: any) {
      const status = error.response?.status ?? error.code;
      if (status === 404) {
        throw new Error(
          `Recurring event "${eventId}" not found in calendar "${calendarId}". Verify the ID belongs to a recurring series.`
        );
      }
      if (status === 400) {
        throw new Error(
          `Invalid request: "${eventId}" may not be a recurring event. The instances endpoint only works on recurring series.`
        );
      }
      if (status === 403) {
        throw new Error(
          `Access denied to event "${eventId}" in calendar "${calendarId}". Check your permissions.`
        );
      }
      throw error;
    }
  },
});
