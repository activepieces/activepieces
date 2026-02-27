import { PieceAuth } from '@activepieces/pieces-framework';

export const googleCalendarAuth = PieceAuth.OAuth2({
  description: '',
  authUrl: 'https://accounts.google.com/o/oauth2/auth',
  tokenUrl: 'https://oauth2.googleapis.com/token',
  required: true,
  pkce: true,
  scope: [
    'https://www.googleapis.com/auth/calendar.events',
    'https://www.googleapis.com/auth/calendar.readonly',
    // TODO: Add the scope after Google App Verification
    // 'https://www.googleapis.com/auth/calendar.calendarlist'
  ],
});
