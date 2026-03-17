import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { getFilPrice } from './lib/actions/get-fil-price';
import { getNetworkStats } from './lib/actions/get-network-stats';
import { getStorageProviderInfo } from './lib/actions/get-storage-provider-info';
import { getCirculatingSupply } from './lib/actions/get-circulating-supply';
import { getDealInfo } from './lib/actions/get-deal-info';

export const filecoin = createPiece({
  displayName: 'Filecoin',
  description:
    'Filecoin is a decentralized storage network built on IPFS. Storage providers earn FIL tokens for storing client data on one of the largest decentralized storage networks.',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.20.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/filecoin.png',
  authors: ['bossco7598'],
  actions: [
    getFilPrice,
    getNetworkStats,
    getStorageProviderInfo,
    getCirculatingSupply,
    getDealInfo,
  ],
  triggers: [],
});
