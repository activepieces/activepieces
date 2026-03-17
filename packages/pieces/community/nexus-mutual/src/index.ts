import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { getProtocolTvl } from './lib/actions/get-protocol-tvl';
import { getNxmPrice } from './lib/actions/get-nxm-price';
import { getChainBreakdown } from './lib/actions/get-chain-breakdown';
import { getTvlHistory } from './lib/actions/get-tvl-history';
import { getProtocolStats } from './lib/actions/get-protocol-stats';

export const nexusMutual = createPiece({
  displayName: 'Nexus Mutual',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/nexus-mutual.png',
  authors: ['bossco7598'],
  categories: [PieceCategory.FINANCE_AND_ACCOUNTING],
  description:
    'Nexus Mutual is a decentralized insurance protocol on Ethereum. Get TVL, token price, chain breakdown, and market stats.',
  actions: [getProtocolTvl, getNxmPrice, getChainBreakdown, getTvlHistory, getProtocolStats],
  triggers: [],
});
