import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { rssNewItemTrigger } from './lib/triggers/new-item-trigger';

export const rssFeed = createPiece({
	displayName: "RSS Feed",
	logoUrl: 'https://cdn.activepieces.com/pieces/rss.png',
	auth: PieceAuth.None(),
	actions: [],
	triggers: [rssNewItemTrigger],
});
