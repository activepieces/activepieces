import { createPiece } from '@activepieces/framework';
import { rssNewItemTrigger } from './triggers/new-item-trigger';

export const rssFeed = createPiece({
	name: 'rss',
	displayName: "RSS Feed",
	logoUrl: 'https://www.corporate3design.com/uploads/Image/blog/2017/march/rss-icon-1.png',
  version: '0.0.0',
	actions: [],
	triggers: [rssNewItemTrigger],
});
