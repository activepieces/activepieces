import { createPiece, PieceAuth } from '@activepieces/pieces-framework'
import { rssNewItemListTrigger } from './lib/triggers/new-item-list-triggers'
import { rssNewItemTrigger } from './lib/triggers/new-item-trigger'

export const rssFeed = createPiece({
    displayName: 'RSS Feed',
    description: 'Stay updated with RSS feeds',
    authors: ['Abdallah-Alwarawreh', 'kishanprmr', 'khaledmashaly', 'abuaboud', 'Kevinyu-alan'],
    minimumSupportedRelease: '0.30.0',
    logoUrl: 'https://cdn.activepieces.com/pieces/rss.png',
    categories: [],
    auth: PieceAuth.None(),
    actions: [],
    triggers: [rssNewItemTrigger, rssNewItemListTrigger],
})
