import { createAction, Property } from '@activepieces/pieces-framework';
import {
  HttpRequest,
  HttpMethod,
  AuthenticationType,
  httpClient,
} from '@activepieces/pieces-common';
import { googleCalendarCommon, googleCalendarAuth, getAccessToken } from '../common';
import { getCalendars } from '../common/helper';
import { GoogleCalendarEvent, GoogleCalendarEventList } from '../common/types';
import dayjs from 'dayjs';

export const searchEventsAllCalendars = createAction({
  auth: googleCalendarAuth,
  name: 'google_calendar_search_events_all_calendars',
  displayName: 'Search Events Across Calendars',
  description:
    'Searches every calendar the account can access for events matching a keyword within a required time window.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Search all of the user\'s calendars at once for events matching a text query within a required time window, returning each match tagged with its owning calendarId so you can then get/update/delete it. Use this instead of Get all Events when you know a keyword and time range but do NOT know which calendar the event lives in (Get all Events searches a single calendar). A start and end time are mandatory to bound the cross-calendar scan; matching uses Google\'s native q= filter, not semantic search. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    query: Property.ShortText({
      displayName: 'Search Term',
      description:
        'Free-text query matched against event fields (summary, description, location, attendee names/emails) using Google\'s native search. Example: "budget review".',
      required: true,
    }),
    start_date: Property.DateTime({
      displayName: 'Start Time',
      description:
        'Lower bound (inclusive) for an event\'s end time, as an ISO 8601 timestamp (e.g. "2026-06-01T00:00:00Z"). Required to bound the cross-calendar scan.',
      required: true,
    }),
    end_date: Property.DateTime({
      displayName: 'End Time',
      description:
        'Upper bound (exclusive) for an event\'s start time, as an ISO 8601 timestamp (e.g. "2026-06-30T23:59:59Z"). Required to bound the cross-calendar scan.',
      required: true,
    }),
    single_events: Property.Checkbox({
      displayName: 'Expand Recurring Events?',
      description:
        'When enabled, recurring events are expanded into their individual instances instead of returning the underlying recurring event.',
      required: false,
      defaultValue: true,
    }),
  },
  async run(context) {
    const { query, start_date, end_date, single_events } = context.propsValue;
    const token = await getAccessToken(context.auth);

    const timeMin = dayjs(start_date).toISOString();
    const timeMax = dayjs(end_date).toISOString();

    const calendars = await getCalendars(context.auth);

    const matches: (GoogleCalendarEvent & { calendarId: string })[] = [];
    const skipped: { calendarId: string; status: number }[] = [];

    for (const calendar of calendars) {
      let pageToken = '';
      do {
        const queryParams: Record<string, string> = {
          q: query,
          timeMin,
          timeMax,
          singleEvents: single_events ? 'true' : 'false',
          showDeleted: 'false',
          maxResults: '250',
        };
        if (pageToken) {
          queryParams['pageToken'] = pageToken;
        }
        const request: HttpRequest = {
          method: HttpMethod.GET,
          url: `${googleCalendarCommon.baseUrl}/calendars/${encodeURIComponent(
            calendar.id
          )}/events`,
          queryParams,
          authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token,
          },
        };
        try {
          const response =
            await httpClient.sendRequest<GoogleCalendarEventList>(request);
          const items = response.body.items ?? [];
          for (const event of items) {
            matches.push({ ...event, calendarId: calendar.id });
          }
          pageToken = response.body.nextPageToken;
        } catch (error: any) {
          const status = error.response?.status;
          if (status === 403 || status === 404) {
            skipped.push({ calendarId: calendar.id, status });
            pageToken = '';
            continue;
          }
          if (status === 429) {
            throw new Error(
              'Google Calendar rate limit reached while searching calendars. Please retry shortly.'
            );
          }
          throw error;
        }
      } while (pageToken);
    }

    return {
      events: matches,
      count: matches.length,
      calendars_searched: calendars.length - skipped.length,
      ...(skipped.length > 0
        ? {
            skipped_calendars: skipped,
            warning:
              'Some calendars could not be searched (access denied or not found); a missing match may live in a skipped calendar. See skipped_calendars.',
          }
        : {}),
    };
  },
});
