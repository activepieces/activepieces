import { createPiece } from '@activepieces/pieces-framework';
import { getProtocolTvl } from './actions/get-protocol-tvl';
import { getSpellPrice } from './actions/get-spell-price';
import { getMimPeg } from './actions/get-mim-peg';
import { getChainBreakdown } from './actions/get-chain-breakdown';
import { getTvlHistory } from './actions/get-tvl-history';

export const spellToken = createPiece({
  displayName: 'Spell Token',
  auth: undefined,
  minimumSupportedRelease: '0.20.0',
  logoUrl: 'https://cryptologos.cc/logos/spell-token-spell-logo.png',
  authors: ['bossco7598'],
  actions: [getProtocolTvl, getSpellPrice, getMimPeg, getChainBreakdown, getTvlHistory],
  triggers: [],
});
