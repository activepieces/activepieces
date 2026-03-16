import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { getActiveAddressesAction } from './lib/actions/get-active-addresses';
import { getTransactionsCountAction } from './lib/actions/get-transactions-count';
import { getFeesMeanAction } from './lib/actions/get-fees-mean';
import { getExchangeSupplyAction } from './lib/actions/get-exchange-supply';
import { getSoprAction } from './lib/actions/get-sopr';

export const glassnodeAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: `To get your Glassnode API key:
1. Sign up at https://glassnode.com
2. Go to your account settings
3. Navigate to the API section
4. Copy your API key`,
  required: true,
});

export const glassnode = createPiece({
  displayName: 'Glassnode',
  description: 'On-chain metrics and blockchain analytics for Bitcoin and Ethereum',
  auth: glassnodeAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/glassnode.png',
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  authors: ['bossco7598'],
  actions: [
    getActiveAddressesAction,
    getTransactionsCountAction,
    getFeesMeanAction,
    getExchangeSupplyAction,
    getSoprAction,
  ],
  triggers: [],
});
