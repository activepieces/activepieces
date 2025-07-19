import { createCustomApiCallAction } from '@ensemble/pieces-common';
import {
  OAuth2PropertyValue,
  PieceAuth,
  createPiece,
} from '@ensemble/pieces-framework';
import { PieceCategory } from '@ensemble/shared';
import { createEvent } from './lib/actions/create-event';
import { createQuickCalendarEvent } from './lib/actions/create-quick-event';
import { deleteEventAction } from './lib/actions/delete-event.action';
import { getEvents } from './lib/actions/get-events';
import { updateEventAction } from './lib/actions/update-event.action';
import { googleCalendarCommon } from './lib/common';
import { calendarEventChanged } from './lib/triggers/calendar-event';
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
  ],
});

export const googleCalendar = createPiece({
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.ensemble.com/pieces/google-calendar.png',
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
  triggers: [calendarEventChanged],
});
