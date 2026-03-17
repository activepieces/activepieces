import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { getProtocolTvl } from './lib/actions/get-protocol-tvl';
import { getVetPrice } from './lib/actions/get-vet-price';
import { getVthoPrice } from './lib/actions/get-vtho-price';
import { getChainBreakdown } from './lib/actions/get-chain-breakdown';
import { getTvlHistory } from './lib/actions/get-tvl-history';

export const vechain = createPiece({
  displayName: 'VeChain',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/vechain.png',
  authors: ['bossco7598'],
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  description:
    'VeChain is a Layer-1 blockchain platform focused on supply chain management and enterprise adoption, featuring a two-token system: VET (governance/value) and VTHO (gas).',
  actions: [
    getProtocolTvl,
    getVetPrice,
    getVthoPrice,
    getChainBreakdown,
    getTvlHistory,
  ],
  triggers: [],
});
