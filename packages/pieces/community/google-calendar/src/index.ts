import { createCustomApiCallAction } from '@activepieces/pieces-common';
import {
  createPiece,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { createEvent } from './lib/actions/create-event';
import { createQuickCalendarEvent } from './lib/actions/create-quick-event';
import { deleteEventAction } from './lib/actions/delete-event.action';
import { getEvents } from './lib/actions/get-events';
import { updateEventAction } from './lib/actions/update-event.action';
import { googleCalendarCommon, googleCalendarAuth, getAccessToken } from './lib/common';
import { calendarEventChanged } from './lib/triggers/calendar-event';
import { addAttendeesToEventAction } from './lib/actions/add-attendees.action';
import { findFreeBusy } from './lib/actions/find-busy-free-periods';
import { getEventById } from './lib/actions/get-event-by-id';
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
    // TODO: add action after calendarList scope is verified
    // addCalendarToCalendarlist,
    createCustomApiCallAction({
      auth: googleCalendarAuth,
      baseUrl() {
        return googleCalendarCommon.baseUrl;
      },
      authMapping: async (auth) => {
        return {
          Authorization: `Bearer ${await getAccessToken(auth as any)}`,
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
