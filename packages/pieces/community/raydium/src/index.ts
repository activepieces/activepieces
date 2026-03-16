import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { getProtocolInfo } from './lib/actions/get-protocol-info';
import { getPairs } from './lib/actions/get-pairs';
import { getPools } from './lib/actions/get-pools';
import { getPairInfo } from './lib/actions/get-pair-info';
import { getPoolInfo } from './lib/actions/get-pool-info';

export const raydium = createPiece({
  displayName: 'Raydium',
  description: 'Raydium is an automated market maker (AMM) and DEX built on the Solana blockchain. Access protocol stats, trading pairs, liquidity pools, and concentrated liquidity positions.',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.20.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/raydium.png',
  authors: ['bossco7598'],
  categories: [PieceCategory.FINANCE_AND_ACCOUNTING],
  actions: [
    getProtocolInfo,
    getPairs,
    getPools,
    getPairInfo,
    getPoolInfo,
  ],
  triggers: [],
});
