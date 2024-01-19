import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

import { createSession } from './lib/actions/create-session';
import { createEvent } from './lib/actions/create-event';
import { publishEvent } from './lib/actions/publish-event';
import { bookingCreated } from './lib/triggers/booking-created';
import { bookingStarted } from './lib/triggers/booking-started';
import { bookingEnded } from './lib/triggers/booking-ended';
import { eventCreated } from './lib/triggers/event-created';
import { eventStarted } from './lib/triggers/event-started';
import { eventEnded } from './lib/triggers/event-ended';
import { eventNewRegistration } from './lib/triggers/event-new-registration';
import { eventPublished } from './lib/triggers/event-published';
import { sessionCreated } from './lib/triggers/session-created';
import { sessionStarted } from './lib/triggers/session-started';
import { sessionEnded } from './lib/triggers/session-ended';
import { takeawayReady } from './lib/triggers/takeaway-ready';
import { transcriptReady } from './lib/triggers/transcript-ready';

export const sessionAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  validate: async ({ auth }) => {
    try {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: 'https://api.app.sessions.us/api/sessions',
        headers: {
          accept: 'application/json',
          'x-api-key': `${auth}`,
        },
      });
      return {
        valid: true,
      };
    } catch (e) {
      return {
        error: 'Invalid API Key',
        valid: false,
      };
    }
  },
});

export const sessionsUs = createPiece({
  displayName: 'Sessions.us',
  auth: sessionAuth,
  minimumSupportedRelease: '0.9.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/sessions-us.png',
  authors: ['Owlcept', 'MoShizzle'],
  actions: [createSession, createEvent, publishEvent],
  triggers: [
    bookingCreated,
    bookingStarted,
    bookingEnded,
    eventCreated,
    eventPublished,
    eventStarted,
    eventEnded,
    eventNewRegistration,
    sessionCreated,
    sessionStarted,
    sessionEnded,
    takeawayReady,
    transcriptReady,
  ],
});
