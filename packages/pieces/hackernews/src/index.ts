import { createPiece } from '@activepieces/framework';
import { fetchTopStories } from './lib/actions/top-stories-in-hacker-news';

export const hackernews = createPiece({
  name: 'hackernews',
  displayName: 'Hackernews',
  logoUrl: 'https://cdn.activepieces.com/pieces/hackernews.png',
  version: '0.0.0',
  authors: ['abuaboud'],
  actions: [fetchTopStories],
  triggers: [],
});
