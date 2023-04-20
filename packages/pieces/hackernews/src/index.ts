import packageJson from '../package.json';
import { createPiece } from '@activepieces/pieces-framework';
import { fetchTopStories } from './lib/actions/top-stories-in-hacker-news';

export const hackernews = createPiece({
  name: 'hackernews',
  displayName: 'Hacker News',
  logoUrl: 'https://cdn.activepieces.com/pieces/hackernews.png',
  version: packageJson.version,
  authors: ['abuaboud'],
  actions: [fetchTopStories],
  triggers: [],
});
