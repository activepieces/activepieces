import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { createOrUpdateSubscriber } from './lib/actions/create-or-update-subscriber';
import { addSubscriberToSegments } from './lib/actions/add-subscriber-to-segments';
import { findSubscriber } from './lib/actions/find-subscriber';

export const flodeskAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: 'Enter your Flodesk API key (Bearer token)',
  required: true,
});

export const flodesk = createPiece({
  displayName: 'Flodesk',
  description: 'Email marketing platform for creators with beautiful templates',
  auth: flodeskAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/flodesk.png',
  categories: [PieceCategory.MARKETING],
  authors: ['tarai-dl'],
  actions: [
    createOrUpdateSubscriber,
    addSubscriberToSegments,
    findSubscriber,
  ],
  triggers: [],
});
