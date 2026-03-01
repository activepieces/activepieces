import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { newCarNewsTrigger } from './lib/triggers/new-car-news';

export const automotiveRssConnector = createPiece({
  displayName: 'Automotive-rss-connector',
  description: '',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/automotive-rss-connector.png',
  authors: [],
  actions: [],
  triggers: [newCarNewsTrigger],
});
