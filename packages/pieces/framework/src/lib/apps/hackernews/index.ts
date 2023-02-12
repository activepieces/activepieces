import { createPiece } from '../../framework/piece';
import { fetchTopStories } from './actions/top-stories-in-hacker-news';

export const hackernews = createPiece({
  name: 'hackernews',
  displayName: 'Hackernews',
  logoUrl: 'https://cdn.activepieces.com/pieces/hackernews.png',
  actions: [fetchTopStories],
  triggers: [],
});