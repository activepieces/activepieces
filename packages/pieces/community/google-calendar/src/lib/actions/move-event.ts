import { createAction, Property } from '@activepieces/pieces-framework';
import { calendar as googleCalendar } from '@googleapis/calendar';
import {
  googleCalendarCommon,
  googleCalendarAuth,
  createGoogleClient,
  GoogleCalendarAuthValue,
} from '../common';
import { getCalendars } from '../common/helper';

export const moveEvent = createAction({
  auth: googleCalendarAuth,
  name: 'google_calendar_move_event',
  displayName: 'Move Event to Another Calendar',
  description:
    'Moves an existing event from one calendar to another, preserving its event ID and metadata.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Move an existing event from a source calendar to a destination calendar in place, preserving the event ID, conferencing, and attendee state. Use this instead of deleting and recreating the event (which loses the ID and metadata) when you need to transfer an event between calendars. Idempotent: moving an event to the calendar it already lives on is treated as a no-op. The source and destination must be writable calendars.',
    idempotent: true,
  },
  props: {
    calendar_id: googleCalendarCommon.calendarDropdown('writer'),
    event_id: Property.ShortText({
      displayName: 'Event ID',
      description:
        'The ID of the event to move, e.g. "abc123def456". Obtain it from Search Events Across Calendars or Get all Events.',
      required: true,
    }),
    destination_calendar_id: Property.Dropdown({
      auth: googleCalendarAuth,
      displayName: 'Destination Calendar',
      description: 'The calendar to move the event to.',
      refreshers: [],
      required: true,
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Please connect your account first',
            options: [],
          };
        }
        const calendars = await getCalendars(auth as GoogleCalendarAuthValue, 'writer');
        return {
          disabled: false,
          options: calendars.map((calendar) => ({
            label: calendar.summary,
            value: calendar.id,
          })),
        };
      },
    }),
    send_updates: Property.StaticDropdown({
      displayName: 'Send Notifications',
      description:
        'Who should receive notifications about the change of the event\'s organizer.',
      required: false,
      defaultValue: 'none',
      options: {
        options: [
          { label: 'To everyone', value: 'all' },
          { label: 'To external guests only', value: 'externalOnly' },
          { label: 'To no one', value: 'none' },
        ],
      },
    }),
  },
  async run(context) {
    const {
      calendar_id: sourceCalendarId,
      event_id: eventId,
      destination_calendar_id: destinationCalendarId,
      send_updates: sendUpdates,
    } = context.propsValue;

    const authClient = await createGoogleClient(context.auth);
    const calendar = googleCalendar({ version: 'v3', auth: authClient });

    if (sourceCalendarId === destinationCalendarId) {
      const existing = await calendar.events.get({
        calendarId: destinationCalendarId,
        eventId,
      });
      return {
        moved: false,
        already_in_destination: true,
        event: existing.data,
      };
    }

    try {
      await calendar.events.move({
        calendarId: sourceCalendarId,
        eventId,
        destination: destinationCalendarId,
        sendUpdates: sendUpdates ?? 'none',
      });

      const verified = await calendar.events.get({
        calendarId: destinationCalendarId,
        eventId,
      });

      return {
        moved: true,
        already_in_destination: false,
        event: verified.data,
      };
    } catch (error: any) {
      const status = error.response?.status ?? error.code;
      if (status === 404) {
        throw new Error(
          `Event "${eventId}" not found in source calendar "${sourceCalendarId}". Verify the event ID and source calendar.`
        );
      }
      if (status === 403) {
        throw new Error(
          `Access denied while moving event "${eventId}". Both the source and destination calendars must be writable.`
        );
      }
      if (status === 400) {
        throw new Error(
          `Invalid move request for event "${eventId}". The destination must differ from the source and both must be valid calendars.`
        );
      }
      throw error;
    }
  },
});
