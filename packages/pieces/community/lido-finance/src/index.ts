import { createPiece, PieceAuth, PieceCategory } from '@activepieces/pieces-framework';
import { getStethApr } from './lib/actions/get-steth-apr';
import { getProtocolStats } from './lib/actions/get-protocol-stats';
import { getAprHistory } from './lib/actions/get-apr-history';
import { getWstethRate } from './lib/actions/get-wsteth-rate';
import { getValidators } from './lib/actions/get-validators';

export const lidoFinance = createPiece({
  displayName: 'Lido Finance',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.20.0',
  logoUrl: 'https://raw.githubusercontent.com/lidofinance/lido-dao/master/assets/logo.svg',
  authors: ['bossco7598'],
  categories: [PieceCategory.FINANCE_AND_ACCOUNTING],
  description:
    'Lido Finance is the leading liquid staking protocol for Ethereum. ' +
    'Stake ETH and receive stETH (liquid staked ETH) that earns staking rewards automatically.',
  actions: [getStethApr, getProtocolStats, getAprHistory, getWstethRate, getValidators],
  triggers: [],
});
