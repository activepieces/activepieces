import { createPiece } from '@activepieces/pieces-framework';
import { getProtocolTvl } from './actions/get-protocol-tvl';
import { getBadgerPrice } from './actions/get-badger-price';
import { getDiggPrice } from './actions/get-digg-price';
import { getChainBreakdown } from './actions/get-chain-breakdown';
import { getTvlHistory } from './actions/get-tvl-history';

export const badgerDao = createPiece({
  displayName: 'Badger DAO',
  auth: undefined,
  minimumSupportedRelease: '0.20.0',
  logoUrl: 'https://cryptologos.cc/logos/badger-dao-badger-logo.png',
  authors: ['bossco7598'],
  actions: [getProtocolTvl, getBadgerPrice, getDiggPrice, getChainBreakdown, getTvlHistory],
  triggers: [],
});
