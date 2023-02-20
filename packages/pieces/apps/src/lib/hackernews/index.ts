import { createPiece } from '@activepieces/framework';
import { fetchTopStories } from './actions/top-stories-in-hacker-news';

export const hackernews = createPiece({
  name: 'hackernews',
  displayName: 'Hackernews',
  logoUrl: 'https://cdn.activepieces.com/pieces/hackernews.png',
  authors: ['abuaboud'],
  actions: [fetchTopStories],
  triggers: [],
});
