import { OAuth2PropertyValue, PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { createQuickCalendarEvent } from './lib/actions/create-quick-event';
import { calendarEventChanged } from './lib/triggers/calendar-event';
import { createEvent } from './lib/actions/create-event';
import { getEvents } from './lib/actions/get-events';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { googleCalendarCommon } from './lib/common';

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
  minimumSupportedRelease: '0.5.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/google-calendar.png',
  displayName: 'Google Calendar',
  authors: ['osamahaikal', 'bibhuty-did-this', 'MoShizzle'],
  auth: googleCalendarAuth,
  actions: [createQuickCalendarEvent, createEvent, getEvents,
    createCustomApiCallAction({
        baseUrl: () => googleCalendarCommon.baseUrl,
        auth: googleCalendarAuth,
        authMapping: (auth) => ({
          'Authorization': `Bearer ${(auth as OAuth2PropertyValue).access_token}`,
        }),
      }),],
  triggers: [calendarEventChanged],
});
