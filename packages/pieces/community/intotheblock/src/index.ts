import { PieceAuth, createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { getInOutOfMoney } from './lib/actions/get-in-out-of-money';
import { getLargeTransactions } from './lib/actions/get-large-transactions';
import { getConcentration } from './lib/actions/get-concentration';
import { getNetworkGrowth } from './lib/actions/get-network-growth';
import { getExchangeNetflows } from './lib/actions/get-exchange-netflows';

const auth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: 'Your IntoTheBlock API key. Sign up at https://intotheblock.com to get one.',
  required: true,
});

export const intotheblock = createPiece({
  displayName: 'IntoTheBlock',
  auth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/intotheblock.png',
  authors: ['bossco7598'],
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  actions: [
    getInOutOfMoney,
    getLargeTransactions,
    getConcentration,
    getNetworkGrowth,
    getExchangeNetflows,
  ],
  triggers: [],
});
