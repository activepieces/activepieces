import { createPiece } from '@activepieces/framework';
import { rssNewItemTrigger } from './triggers/new-item-trigger';

export const rssFeed = createPiece({
	name: 'rss',
	displayName: "RSS Feed",
	logoUrl: 'https://cdn.activepieces.com/pieces/rss.png',
  version: '0.0.0',
	actions: [],
	triggers: [rssNewItemTrigger],
});
