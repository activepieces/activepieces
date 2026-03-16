import { createPiece, PieceAuth, PieceCategory } from '@activepieces/pieces-framework';
import { getProtocolTvl } from './actions/get-protocol-tvl';
import { getVspPrice } from './actions/get-vsp-price';
import { getChainBreakdown } from './actions/get-chain-breakdown';
import { getTvlHistory } from './actions/get-tvl-history';
import { getVaultStats } from './actions/get-vault-stats';

export const vesperFinance = createPiece({
  displayName: 'Vesper Finance',
  description: 'Interact with Vesper Finance DeFi yield optimization vaults',
  logoUrl: 'https://cdn.activepieces.com/pieces/vesper-finance.png',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.30.0',
  categories: [PieceCategory.FINANCE_AND_ACCOUNTING],
  actions: [getProtocolTvl, getVspPrice, getChainBreakdown, getTvlHistory, getVaultStats],
  triggers: [],
});
