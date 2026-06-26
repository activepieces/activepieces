import { createAction, Property } from '@activepieces/pieces-framework';
import { calendar as googleCalendar } from '@googleapis/calendar';
import { googleCalendarCommon, googleCalendarAuth, createGoogleClient } from '../common';
import dayjs from 'dayjs';

export const aiImportEvent = createAction({
  auth: googleCalendarAuth,
  name: 'google_calendar_import_event',
  displayName: 'Import Event',
  description:
    'Import an existing event (by iCalUID) into a Google Calendar as a private copy, using events.import.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Import an existing event into a calendar as a private copy, keyed by its iCalUID with a start and end time (the events.import primitive, distinct from creating a brand-new event or moving one). Use this to copy or de-duplicate an event across calendars; re-importing the same iCalUID updates the existing copy rather than duplicating it. Resolve calendarId via google_calendar_list_calendars (default "primary"). Only default (non-special) events can be imported. Not idempotent: each import can create or mutate the destination copy.',
    idempotent: false,
  },
  props: {
    calendar_id: googleCalendarCommon.calendarDropdown('writer'),
    ical_uid: Property.ShortText({
      displayName: 'iCal UID',
      description:
        'The event\'s iCalUID (its globally unique identifier, e.g. "abc123@google.com"). This is the dedup key: re-importing the same UID updates the existing copy.',
      required: true,
    }),
    summary: Property.ShortText({
      displayName: 'Title',
      description: 'Title (summary) of the imported event.',
      required: true,
    }),
    start_date_time: Property.DateTime({
      displayName: 'Start Time',
      description: 'Event start as an ISO 8601 timestamp (e.g. "2026-06-01T09:00:00Z").',
      required: true,
    }),
    end_date_time: Property.DateTime({
      displayName: 'End Time',
      description: 'Event end as an ISO 8601 timestamp (e.g. "2026-06-01T10:00:00Z").',
      required: true,
    }),
    location: Property.ShortText({
      displayName: 'Location',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Description of the event. You can use HTML tags here.',
      required: false,
    }),
  },
  async run(context) {
    const {
      calendar_id: calendarId,
      ical_uid: iCalUID,
      summary,
      start_date_time,
      end_date_time,
      location,
      description,
    } = context.propsValue;

    const authClient = await createGoogleClient(context.auth);
    const calendar = googleCalendar({ version: 'v3', auth: authClient });

    try {
      const response = await calendar.events.import({
        calendarId,
        requestBody: {
          iCalUID,
          summary,
          location: location ?? undefined,
          description: description ?? undefined,
          start: {
            dateTime: dayjs(start_date_time).toISOString(),
          },
          end: {
            dateTime: dayjs(end_date_time).toISOString(),
          },
        },
      });

      return response.data;
    } catch (error: any) {
      const status = error.response?.status ?? error.code;
      if (status === 403) {
        throw new Error(
          `Access denied while importing into calendar "${calendarId}". The calendar must be writable.`
        );
      }
      if (status === 400) {
        throw new Error(
          `Invalid import request. Ensure iCalUID, start, and end are provided and that the event is a default (non-special) event. (${error.message})`
        );
      }
      throw error;
    }
  },
});
