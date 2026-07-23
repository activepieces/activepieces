import { createAction, Property } from '@activepieces/pieces-framework';
import { calendar as googleCalendar } from '@googleapis/calendar';
import { googleCalendarCommon, googleCalendarAuth, createGoogleClient } from '../common';

export const aiRemoveAttendee = createAction({
  auth: googleCalendarAuth,
  name: 'google_calendar_remove_attendee',
  displayName: 'Remove Attendee',
  description:
    'Remove one attendee (by email) from an existing Google Calendar event, preserving the rest of the guest list.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Remove a single attendee, matched by email, from an existing event by fetching the current attendee list, dropping that one guest, and patching the event. Use this to uninvite one person without disturbing the other guests; to add guests use the add-attendees action instead. Resolve calendarId via google_calendar_list_calendars and eventId via google_calendar_list_events / google_calendar_search_events_all_calendars. Not idempotent (notifications may fire), though re-removing an already-absent attendee is a no-op on state. It uses optimistic concurrency (If-Match on the event revision), so a simultaneous edit by someone else fails with a retry-able conflict instead of silently clobbering their change.',
    idempotent: false,
  },
  props: {
    calendar_id: googleCalendarCommon.calendarDropdown('writer'),
    event_id: Property.ShortText({
      displayName: 'Event ID',
      description:
        'The ID of the event to remove the attendee from. Resolve it via List Events or Search Events Across Calendars.',
      required: true,
    }),
    attendee_email: Property.ShortText({
      displayName: 'Attendee Email',
      description: 'Email address of the attendee to remove from the event.',
      required: true,
    }),
    send_updates: Property.StaticDropdown({
      displayName: 'Send Notifications',
      description: 'Who should be notified about the attendee change.',
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
      calendar_id: calendarId,
      event_id: eventId,
      attendee_email: attendeeEmail,
      send_updates: sendUpdates,
    } = context.propsValue;

    const authClient = await createGoogleClient(context.auth);
    const calendar = googleCalendar({ version: 'v3', auth: authClient });

    const targetEmail = attendeeEmail.trim().toLowerCase();

    try {
      const currentEvent = await calendar.events.get({
        calendarId,
        eventId,
      });

      const currentAttendees = currentEvent.data.attendees ?? [];
      const remainingAttendees = currentAttendees.filter(
        (attendee) => (attendee.email ?? '').trim().toLowerCase() !== targetEmail
      );

      if (remainingAttendees.length === currentAttendees.length) {
        return {
          removed: false,
          attendee_email: attendeeEmail,
          message: `Attendee "${attendeeEmail}" was not on event "${eventId}"; nothing to remove.`,
          event: currentEvent.data,
        };
      }

      const etag = currentEvent.data.etag ?? undefined;
      const response = await calendar.events.patch(
        {
          calendarId,
          eventId,
          sendUpdates: sendUpdates ?? 'none',
          requestBody: {
            attendees: remainingAttendees,
          },
        },
        etag ? { headers: { 'If-Match': etag } } : {}
      );

      return {
        removed: true,
        attendee_email: attendeeEmail,
        event: response.data,
      };
    } catch (error: any) {
      const status = error.response?.status ?? error.code;
      if (status === 412) {
        throw new Error(
          `Event "${eventId}" changed since it was read (a concurrent edit). Re-run Remove Attendee to retry against the latest version.`
        );
      }
      if (status === 404) {
        throw new Error(
          `Event "${eventId}" not found in calendar "${calendarId}". Verify the event ID and calendar.`
        );
      }
      if (status === 403) {
        throw new Error(
          `Access denied while editing event "${eventId}". The calendar must be writable.`
        );
      }
      throw error;
    }
  },
});
