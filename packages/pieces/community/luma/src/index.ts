import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { createEvent } from './lib/actions/create-event';
import { getEvent } from './lib/actions/get-event';
import { listEvents } from './lib/actions/list-events';
import { createGuest } from './lib/actions/create-guest';

export const lumaAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: 'Enter your Luma API key (x-luma-api-key header)',
  required: true,
});

export const luma = createPiece({
  displayName: 'Luma',
  description: 'Event management platform for tech communities and conferences',
  auth: lumaAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/luma.png',
  categories: [PieceCategory.MARKETING],
  authors: ['tarai-dl'],
  actions: [
    createEvent,
    getEvent,
    listEvents,
    createGuest,
  ],
  triggers: [],
});
