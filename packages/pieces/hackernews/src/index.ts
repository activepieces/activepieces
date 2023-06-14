import { createPiece } from '@activepieces/pieces-framework';
import { fetchTopStories } from './lib/actions/top-stories-in-hacker-news';

export const hackernews = createPiece({
  displayName: 'Hacker News',
  logoUrl: 'https://cdn.activepieces.com/pieces/hackernews.png',
  authors: ['abuaboud'],
  actions: [fetchTopStories],
  triggers: [],
});
