import { createAction } from '@activepieces/pieces-framework';
import { googleCalendarAuth, getAccessToken } from '../common';
import { getCalendars } from '../common/helper';

export const aiListCalendars = createAction({
  auth: googleCalendarAuth,
  name: 'google_calendar_list_calendars',
  displayName: 'List Calendars',
  description:
    'List every calendar in the user\'s calendar list, returning each calendar\'s id, summary, access role, time zone, and whether it is primary.',
  audience: 'ai',
  aiMetadata: {
    description:
      'List all calendars on the user\'s calendar list, returning each one\'s calendarId, summary, accessRole, timeZone, and whether it is the primary calendar. This is the calendarId resolver: call it first to discover which calendars exist and obtain the calendarId that every event/freebusy atomic needs (default "primary"). Read-only and idempotent.',
    idempotent: true,
  },
  props: {},
  async run(context) {
    // Touch the access token early so auth/scope errors surface clearly.
    await getAccessToken(context.auth);

    const calendars = await getCalendars(context.auth);

    return {
      calendars: calendars.map((calendar) => ({
        id: calendar.id,
        summary: calendar.summary,
        description: calendar.description,
        location: calendar.location,
        timeZone: calendar.timeZone,
        accessRole: calendar.accessRole,
        primary: calendar.primary ?? false,
        selected: calendar.selected ?? false,
        backgroundColor: calendar.backgroundColor,
        foregroundColor: calendar.foregroundColor,
      })),
      count: calendars.length,
    };
  },
});
