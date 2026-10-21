import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { findSuppliers } from './lib/actions/find-suppliers';
import { getBuyerProfile, getSupplierProfile } from './lib/actions/get-profile';
import { searchTenders } from './lib/actions/search-tenders';
import { sellToStateAuth } from './lib/common/auth';
import { BASE_URL } from './lib/common/client';
import { newTender } from './lib/triggers/new-tender';

export const sellToState = createPiece({
  displayName: 'Sell to State',
  description:
    'Government tenders and contract awards from official procurement sources in 60+ countries: open tenders, buyers and suppliers.',
  auth: sellToStateAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/sell-to-state.png',
  categories: [PieceCategory.SALES_AND_CRM],
  authors: ['nadyyym'],
  actions: [
    searchTenders,
    findSuppliers,
    getBuyerProfile,
    getSupplierProfile,
    createCustomApiCallAction({
      baseUrl: () => BASE_URL,
      auth: sellToStateAuth,
      authMapping: async (auth) => ({ 'x-api-key': auth.secret_text }),
    }),
  ],
  triggers: [newTender],
});
