import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { getProtocolTvl } from './lib/actions/get-protocol-tvl';
import { getMplPrice } from './lib/actions/get-mpl-price';
import { getSyrupPrice } from './lib/actions/get-syrup-price';
import { getChainBreakdown } from './lib/actions/get-chain-breakdown';
import { getTvlHistory } from './lib/actions/get-tvl-history';

export const mapleFinance = createPiece({
  displayName: 'Maple Finance',
  description:
    'Institutional capital marketplace for undercollateralized lending on Ethereum and Solana.',
  logoUrl: 'https://cdn.activepieces.com/pieces/maple-finance.png',
  minimumSupportedRelease: '0.30.0',
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  auth: undefined,
  authors: ['bossco7598'],
  actions: [
    getProtocolTvl,
    getMplPrice,
    getSyrupPrice,
    getChainBreakdown,
    getTvlHistory,
  ],
  triggers: [],
});
