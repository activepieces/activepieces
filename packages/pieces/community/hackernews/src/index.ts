import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { fetchTopStories } from './lib/actions/top-stories-in-hacker-news';

export const hackernews = createPiece({
  displayName: 'Hacker News',
  minimumSupportedRelease: '0.5.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/hackernews.png',
  auth: PieceAuth.None(),
  categories: [],
  authors: ['abuaboud'],
  actions: [fetchTopStories],
  triggers: [],
});
