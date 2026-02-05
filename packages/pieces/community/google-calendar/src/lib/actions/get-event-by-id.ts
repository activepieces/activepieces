import { createAction, Property } from '@activepieces/pieces-framework';
import {
  HttpRequest,
  HttpMethod,
  AuthenticationType,
  httpClient,
} from '@activepieces/pieces-common';
import { googleCalendarCommon } from '../common';
import { googleCalendarAuth } from '../../';
import { GoogleCalendarEvent } from '../common/types';

export const getEventById = createAction({
  auth: googleCalendarAuth,
  name: 'google_calendar_get_event_by_id',
  displayName: 'Get Event by ID',
  description: 'Fetch event details by its unique ID from Google Calendar.',
  props: {
    calendar_id: googleCalendarCommon.calendarDropdown(),
    event_id: Property.ShortText({
      displayName: 'Event ID',
      description:
        'The unique ID of the event (e.g., "abc123def456"). You can find this in the event URL or from other calendar actions.',
      required: true,
    }),
    max_attendees: Property.Number({
      displayName: 'Max Attendees',
      description:
        'Maximum number of attendees to include in the response. If there are more attendees, only the participant is returned.',
      required: false,
    }),
    time_zone: Property.ShortText({
      displayName: 'Time Zone',
      description:
        'Time zone for the response (e.g., "America/New_York", "Europe/London"). Defaults to the calendar\'s time zone if not specified.',
      required: false,
    }),
  },
  async run(context) {
    const {
      calendar_id: calendarId,
      event_id: eventId,
      max_attendees: maxAttendees,
      time_zone: timeZone,
    } = context.propsValue;
    const { access_token: token } = context.auth;

    if (
      !calendarId ||
      typeof calendarId !== 'string' ||
      calendarId.trim().length === 0
    ) {
      throw new Error('Calendar ID is required');
    }

    if (
      !eventId ||
      typeof eventId !== 'string' ||
      eventId.trim().length === 0
    ) {
      throw new Error('Event ID cannot be empty');
    }

    if (eventId.length < 5 || eventId.length > 1024) {
      throw new Error('Event ID must be between 5 and 1024 characters');
    }

    const queryParams: Record<string, string> = {};

    if (maxAttendees !== undefined && maxAttendees > 0) {
      queryParams.maxAttendees = maxAttendees.toString();
    }

    if (
      timeZone &&
      typeof timeZone === 'string' &&
      timeZone.trim().length > 0
    ) {
      queryParams.timeZone = timeZone.trim();
    }

    const url = `${googleCalendarCommon.baseUrl}/calendars/${encodeURIComponent(
      calendarId.trim()
    )}/events/${encodeURIComponent(eventId.trim())}`;

    const request: HttpRequest = {
      method: HttpMethod.GET,
      url: url,
      queryParams: queryParams,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: token,
      },
    };

    try {
      const response = await httpClient.sendRequest<GoogleCalendarEvent>(
        request
      );
      return response.body;
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error(
          `Event with ID "${eventId}" not found in calendar "${calendarId}". Please verify the event ID and calendar selection.`
        );
      } else if (error.response?.status === 403) {
        throw new Error(
          `Access denied to event "${eventId}" in calendar "${calendarId}". Please check your permissions.`
        );
      } else if (error.response?.status === 400) {
        throw new Error(
          `Invalid request parameters. Please check the event ID format and other parameters.`
        );
      } else if (error.response?.status === 401) {
        throw new Error(
          'Authentication failed. Please reconnect your Google Calendar account.'
        );
      } else {
        throw new Error(
          `Failed to fetch event: ${error.message || 'Unknown error occurred'}`
        );
      }
    }
  },
});
