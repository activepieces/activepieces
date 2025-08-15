import { createCustomApiCallAction } from '@activepieces/pieces-common';
import {
  OAuth2PropertyValue,
  PieceAuth,
  createPiece,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { createEvent } from './lib/actions/create-event';
import { createQuickCalendarEvent } from './lib/actions/create-quick-event';
import { deleteEventAction } from './lib/actions/delete-event.action';
import { findBusyFreePeriods } from './lib/actions/find-busy-free-periods';
import { getEventById } from './lib/actions/get-event-by-id';
import { getEvents } from './lib/actions/get-events';
import { updateEventAction } from './lib/actions/update-event.action';
import { googleCalendarCommon } from './lib/common';
import { calendarEventChanged } from './lib/triggers/calendar-event';
import { newCalendarEvent } from './lib/triggers/new-event';
import { eventEnds } from './lib/triggers/event-ends';
import { eventStartReminder } from './lib/triggers/event-start-reminder';
import { newEventMatchingSearch } from './lib/triggers/new-event-matching-search';
import { eventCancelled } from './lib/triggers/event-cancelled';
import { newCalendar } from './lib/triggers/new-calendar';
import { addAttendeesToEventAction } from './lib/actions/add-attendees.action';

export const googleCalendarAuth = PieceAuth.OAuth2({
  description: '',
  authUrl: 'https://accounts.google.com/o/oauth2/auth',
  tokenUrl: 'https://oauth2.googleapis.com/token',
  required: true,
  pkce: true,
  scope: [
    'https://www.googleapis.com/auth/calendar.events',
    'https://www.googleapis.com/auth/calendar.readonly',
    'https://www.googleapis.com/auth/calendar.freebusy',
  ],
});

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
  ],
  auth: googleCalendarAuth,
  actions: [
    addAttendeesToEventAction,
    createQuickCalendarEvent,
    createEvent,
    findBusyFreePeriods,
    getEventById,
    getEvents,
    updateEventAction,
    deleteEventAction,
    createCustomApiCallAction({
      auth: googleCalendarAuth,
      baseUrl() {
        return googleCalendarCommon.baseUrl;
      },
      authMapping: async (auth) => {
        return {
          Authorization: `Bearer ${(auth as OAuth2PropertyValue).access_token}`,
        };
      },
    }),
  ],
  triggers: [
    calendarEventChanged,
    newCalendarEvent,
    eventEnds,
    eventStartReminder,
    newEventMatchingSearch,
    eventCancelled,
    newCalendar,
  ],
});
