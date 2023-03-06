import packageJson from '../package.json';
import { createPiece } from '@activepieces/framework';
import { fetchTopStories } from './lib/actions/top-stories-in-hacker-news';

export const hackernews = createPiece({
  name: 'hackernews',
  displayName: 'Hackernews',
  logoUrl: 'https://cdn.activepieces.com/pieces/hackernews.png',
  version: packageJson.version,
  authors: ['abuaboud'],
  actions: [fetchTopStories],
  triggers: [],
});
