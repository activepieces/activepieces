import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { getProtocolTvl } from './lib/actions/get-protocol-tvl';
import { getEvmosPrice } from './lib/actions/get-evmos-price';
import { getChainBreakdown } from './lib/actions/get-chain-breakdown';
import { getTvlHistory } from './lib/actions/get-tvl-history';
import { getProtocolStats } from './lib/actions/get-protocol-stats';

export const evmos = createPiece({
  displayName: 'Evmos',
  description:
    'Evmos is an EVM-compatible Layer-1 blockchain in the Cosmos ecosystem, enabling Ethereum dApps and smart contracts to run natively on Cosmos with IBC interoperability. EVMOS is the native token. Monitor TVL, EVMOS price, chain breakdown, historical TVL, and protocol stats — all via free public APIs.',
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  auth: undefined,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/evmos.png',
  authors: ['bossco7598'],
  actions: [
    getProtocolTvl,
    getEvmosPrice,
    getChainBreakdown,
    getTvlHistory,
    getProtocolStats,
  ],
  triggers: [],
});
