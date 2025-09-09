import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';

// People actions
import { getPersonPaths } from './lib/actions/people/get-person-paths';
import { sortPeople } from './lib/actions/people/sort-people';
import { enrichEmail } from './lib/actions/people/enrich-email';
import { enrichPersonBasic } from './lib/actions/people/enrich-person-basic';
import { enrichEmailsBulk } from './lib/actions/people/enrich-emails-bulk';

// Company actions
import { sortCompanies } from './lib/actions/companies/sort-companies';
import { enrichCompanyBasic } from './lib/actions/companies/enrich-company-basic';

export const villageAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description: 'Your Village API Key',
});

export const village = createPiece({
  displayName: 'Village',
  description: 'The Social Capital API',
  auth: villageAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/village.png',
  categories: [
    PieceCategory.PRODUCTIVITY,
    PieceCategory.SALES_AND_CRM,
  ],
  authors: ['rafaelmuttoni'],
  actions: [
    // People actions
    getPersonPaths,
    sortPeople,
    enrichEmail,
    enrichPersonBasic,
    enrichEmailsBulk,
    // Company actions
    sortCompanies,
    enrichCompanyBasic,
  ],
  triggers: [],
});