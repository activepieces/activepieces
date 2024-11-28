import {
  createCustomApiCallAction,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import { createPiece, PieceAuth } from '@activepieces/pieces-framework';

import { PieceCategory } from '@activepieces/shared';
import { createEvent } from './lib/actions/create-event';
import { createSession } from './lib/actions/create-session';
import { publishEvent } from './lib/actions/publish-event';
import { bookingCreated } from './lib/triggers/booking-created';
import { bookingEnded } from './lib/triggers/booking-ended';
import { bookingStarted } from './lib/triggers/booking-started';
import { eventCreated } from './lib/triggers/event-created';
import { eventEnded } from './lib/triggers/event-ended';
import { eventNewRegistration } from './lib/triggers/event-new-registration';
import { eventPublished } from './lib/triggers/event-published';
import { eventStarted } from './lib/triggers/event-started';
import { sessionCreated } from './lib/triggers/session-created';
import { sessionEnded } from './lib/triggers/session-ended';
import { sessionStarted } from './lib/triggers/session-started';
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
  description: 'Video conferencing platform for businesses and professionals',
  auth: sessionAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/sessions-us.png',
  authors: ["kishanprmr","MoShizzle","abuaboud"],
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  actions: [
    createSession,
    createEvent,
    publishEvent,
    createCustomApiCallAction({
      baseUrl: () => 'https://api.app.sessions.us/api',
      auth: sessionAuth,
      authMapping: async (auth) => ({
        'x-api-key': `${auth}`,
      }),
    }),
  ],
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
