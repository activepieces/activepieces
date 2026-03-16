import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { openSeaAuth } from './lib/auth';
import { getNftAction } from './lib/actions/get-nft';
import { listNftsByCollectionAction } from './lib/actions/list-nfts-by-collection';
import { getCollectionStatsAction } from './lib/actions/get-collection-stats';
import { getListingsAction } from './lib/actions/get-listings';
import { getOffersAction } from './lib/actions/get-offers';

export const openSea = createPiece({
  displayName: 'OpenSea',
  description:
    'OpenSea is the world\'s largest NFT marketplace. Browse, buy, and analyze NFTs, collections, listings, and offers across multiple blockchains.',
  auth: openSeaAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/opensea.png',
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  authors: ['bossco7598'],
  actions: [
    getNftAction,
    listNftsByCollectionAction,
    getCollectionStatsAction,
    getListingsAction,
    getOffersAction,
  ],
  triggers: [],
});
