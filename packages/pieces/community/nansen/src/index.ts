import { createPiece, PieceAuth, PieceCategory } from '@activepieces/pieces-framework';
import { getSmartMoneyHoldings } from './lib/actions/get-smart-money-holdings';
import { getSmartMoneyNetflow } from './lib/actions/get-smart-money-netflow';
import { getSmartMoneyDexTrades } from './lib/actions/get-smart-money-dex-trades';
import { getAddressProfile } from './lib/actions/get-address-profile';
import { getAddressLabels } from './lib/actions/get-address-labels';

export const nansenAuth = PieceAuth.SecretText({
  displayName: 'Nansen API Key',
  description: 'Your Nansen API key. Get one at https://nansen.ai/api (paid plans)',
  required: true,
});

export const nansen = createPiece({
  displayName: 'Nansen',
  auth: nansenAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/nansen.png',
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  authors: ['bossco7598'],
  actions: [
    getSmartMoneyHoldings,
    getSmartMoneyNetflow,
    getSmartMoneyDexTrades,
    getAddressProfile,
    getAddressLabels,
  ],
  triggers: [],
});
