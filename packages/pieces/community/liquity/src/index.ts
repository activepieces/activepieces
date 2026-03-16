import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { getProtocolTvl } from './lib/actions/get-protocol-tvl';
import { getLusdPrice } from './lib/actions/get-lusd-price';
import { getLqtyPrice } from './lib/actions/get-lqty-price';
import { getChainBreakdown } from './lib/actions/get-chain-breakdown';
import { getTvlHistory } from './lib/actions/get-tvl-history';

export const liquity = createPiece({
  displayName: 'Liquity',
  description: 'Liquity decentralized borrowing protocol — interest-free loans against ETH collateral, paid in LUSD stablecoin',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/liquity.png',
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  authors: ['bossco7598'],
  actions: [getProtocolTvl, getLusdPrice, getLqtyPrice, getChainBreakdown, getTvlHistory],
  triggers: [],
});
