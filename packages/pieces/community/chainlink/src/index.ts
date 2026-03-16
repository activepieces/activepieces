import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { getPriceFeed } from './lib/actions/get-price-feed';
import { listPriceFeeds } from './lib/actions/list-price-feeds';
import { getFeedHistory } from './lib/actions/get-feed-history';
import { getFeedStats } from './lib/actions/get-feed-stats';
import { searchFeeds } from './lib/actions/search-feeds';

export const chainlink = createPiece({
  displayName: 'Chainlink',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/chainlink.png',
  authors: ['bossco7598'],
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  description:
    'Access Chainlink decentralized oracle price feeds for DeFi and Web3 applications. Get real-time and historical cryptocurrency price data.',
  actions: [getPriceFeed, listPriceFeeds, getFeedHistory, getFeedStats, searchFeeds],
  triggers: [],
});
