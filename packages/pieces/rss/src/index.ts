import packageJson from '../package.json';
import { createPiece } from '@activepieces/framework';
import { rssNewItemTrigger } from './lib/triggers/new-item-trigger';

export const rssFeed = createPiece({
	name: 'rss',
	displayName: "RSS Feed",
	logoUrl: 'https://cdn.activepieces.com/pieces/rss.png',
  version: packageJson.version,
	actions: [],
	triggers: [rssNewItemTrigger],
});
