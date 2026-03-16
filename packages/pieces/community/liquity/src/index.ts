import { createPiece } from '@activepieces/pieces-framework';
import { getProtocolTvlAction } from './actions/get-protocol-tvl';
import { getLqtyPriceAction } from './actions/get-lqty-price';
import { getLusdPegAction } from './actions/get-lusd-peg';
import { getChainBreakdownAction } from './actions/get-chain-breakdown';
import { getTvlHistoryAction } from './actions/get-tvl-history';

export const liquity = createPiece({
  displayName: 'Liquity',
  auth: undefined,
  minimumSupportedRelease: '0.20.0',
  logoUrl: 'https://cryptologos.cc/logos/liquity-lqty-logo.png',
  authors: ['bossco7598'],
  actions: [
    getProtocolTvlAction,
    getLqtyPriceAction,
    getLusdPegAction,
    getChainBreakdownAction,
    getTvlHistoryAction,
  ],
  triggers: [],
});
