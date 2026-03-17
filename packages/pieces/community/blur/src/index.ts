import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { getProtocolTvl } from './lib/actions/get-protocol-tvl';
import { getBlurPrice } from './lib/actions/get-blur-price';
import { getChainBreakdown } from './lib/actions/get-chain-breakdown';
import { getTvlHistory } from './lib/actions/get-tvl-history';
import { getProtocolStats } from './lib/actions/get-protocol-stats';

export const blur = createPiece({
  displayName: 'Blur NFT Marketplace',
  auth: undefined,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/blur.png',
  authors: ['bossco7598'],
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  description: 'Blur is the leading professional NFT marketplace on Ethereum, featuring zero trading fees, real-time price feeds, and BLUR governance token. Access protocol TVL, token price, and analytics via DeFiLlama and CoinGecko.',
  actions: [getProtocolTvl, getBlurPrice, getChainBreakdown, getTvlHistory, getProtocolStats],
  triggers: [],
});
