import { createCustomApiCallAction } from '@activepieces/pieces-common';
import {
  createPiece,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/pieces-framework';
import { createEvent } from './lib/actions/create-event';
import { createQuickCalendarEvent } from './lib/actions/create-quick-event';
import { deleteEventAction } from './lib/actions/delete-event.action';
import { getEvents } from './lib/actions/get-events';
import { updateEventAction } from './lib/actions/update-event.action';
import { googleCalendarCommon, googleCalendarAuth, getAccessToken, type GoogleCalendarAuthValue } from './lib/common';
import { calendarEventChanged } from './lib/triggers/calendar-event';
import { addAttendeesToEventAction } from './lib/actions/add-attendees.action';
import { findFreeBusy } from './lib/actions/find-busy-free-periods';
import { getEventById } from './lib/actions/get-event-by-id';
import { searchEventsAllCalendars } from './lib/actions/search-events-all-calendars';
import { findFreeSlots } from './lib/actions/find-free-slots';
import { listRecurringEventInstances } from './lib/actions/list-recurring-event-instances';
import { moveEvent } from './lib/actions/move-event';
import { aiCreateEvent } from './lib/actions/ai-create-event';
import { aiUpdateEvent } from './lib/actions/ai-update-event';
import { aiDeleteEvent } from './lib/actions/ai-delete-event';
import { aiGetEvent } from './lib/actions/ai-get-event';
import { aiListEvents } from './lib/actions/ai-list-events';
import { aiFindBusyPeriods } from './lib/actions/ai-find-busy-periods';
import { aiRemoveAttendee } from './lib/actions/ai-remove-attendee';
import { aiImportEvent } from './lib/actions/ai-import-event';
import { aiListCalendars } from './lib/actions/ai-list-calendars';
import { aiGetCalendar } from './lib/actions/ai-get-calendar';
import { aiGetColors } from './lib/actions/ai-get-colors';
import { aiListSettings } from './lib/actions/ai-list-settings';
import { newEvent } from './lib/triggers/new-event';
import { eventEnds } from './lib/triggers/event-ends';
import { eventStartTimeBefore } from './lib/triggers/event-start-time-before';
import { newEventMatchingSearch } from './lib/triggers/new-event-matching-search';
import { eventCancelled } from './lib/triggers/event-cancelled';
import { newCalendar } from './lib/triggers/new-calendar';

export { googleCalendarAuth, getAccessToken, GoogleCalendarAuthValue, createGoogleClient } from './lib/common';

export const googleCalendar = createPiece({
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/google-calendar.png',
  categories: [PieceCategory.PRODUCTIVITY],
  displayName: 'Google Calendar',
  description: 'Get organized and stay on schedule',

  authors: [
    'OsamaHaikal',
    'bibhuty-did-this',
    'Vitalini',
    'pfernandez98',
    'kishanprmr',
    'MoShizzle',
    'khaledmashaly',
    'abuaboud',
    'ikus060',
    'Cloudieunnie',
    'sanket-a11y',
    'geekyme'
  ],
  auth: googleCalendarAuth,
  actions: [
    addAttendeesToEventAction,
    createQuickCalendarEvent,
    createEvent,
    getEvents,
    updateEventAction,
    deleteEventAction,
    findFreeBusy,
    getEventById,
    searchEventsAllCalendars,
    findFreeSlots,
    listRecurringEventInstances,
    moveEvent,
    aiCreateEvent,
    aiUpdateEvent,
    aiDeleteEvent,
    aiGetEvent,
    aiListEvents,
    aiFindBusyPeriods,
    aiRemoveAttendee,
    aiImportEvent,
    aiListCalendars,
    aiGetCalendar,
    aiGetColors,
    aiListSettings,
    // TODO: add action after calendarList scope is verified
    // addCalendarToCalendarlist,
    createCustomApiCallAction({
      auth: googleCalendarAuth,
      baseUrl() {
        return googleCalendarCommon.baseUrl;
      },
      authMapping: async (auth) => {
        return {
          Authorization: `Bearer ${await getAccessToken(auth as GoogleCalendarAuthValue)}`,
        };
      },
    }),
  ],
  triggers: [calendarEventChanged,
    newEvent,
    eventEnds,
    eventStartTimeBefore,
    newEventMatchingSearch,
    eventCancelled,
    newCalendar
  ],
});
