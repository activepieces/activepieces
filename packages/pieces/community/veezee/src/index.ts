import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { getCompanyAction } from './lib/actions/get-company';
import { getPersonProfileAction } from './lib/actions/get-person-profile';
import { getRecentPostsAction } from './lib/actions/get-recent-posts';
import { resolveLinkedinUrlAction } from './lib/actions/resolve-linkedin-url';
import { searchPeopleAction } from './lib/actions/search-people';
import { veezeeAuth } from './lib/common';

export const veezee = createPiece({
  displayName: 'Veezee',
  description:
    'LinkedIn people and company data: profiles, people search, companies, and recent posts.',
  auth: veezeeAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/veezee.png',
  categories: [PieceCategory.SALES_AND_CRM],
  authors: ['veezee-build'],
  actions: [
    getPersonProfileAction,
    searchPeopleAction,
    getCompanyAction,
    getRecentPostsAction,
    resolveLinkedinUrlAction,
  ],
  triggers: [],
});
