import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { rssNewItemTrigger } from './lib/triggers/new-item-trigger';

export const rssFeed = createPiece({
  displayName: 'RSS Feed',
  minimumSupportedRelease: '0.5.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/rss.png',
  categories: [PieceCategory.OTHER],
  auth: PieceAuth.None(),
  actions: [],
  triggers: [rssNewItemTrigger],
});
