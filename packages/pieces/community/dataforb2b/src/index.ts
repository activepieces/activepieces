import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { DATAFORB2B_API_BASE_URL, dataforb2bAuth } from './lib/common';
import { searchPeople } from './lib/actions/search-people';
import { searchCompanies } from './lib/actions/search-companies';
import { reasoningSearch } from './lib/actions/reasoning-search';
import { typeahead } from './lib/actions/typeahead';
import { enrichProfile } from './lib/actions/enrich-profile';
import { enrichCompany } from './lib/actions/enrich-company';

export const dataforb2b = createPiece({
  displayName: 'DataForB2B',
  description:
    'Power your sales or recruiting AI agent with live B2B data. DataForB2B is a people and company search API with 70+ filters including job title, skills, company size, LinkedIn URL, funding stage, investor, past employers, certifications, years of experience, GitHub repositories, languages and more.',
  auth: dataforb2bAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/dataforb2b.png',
  categories: [PieceCategory.SALES_AND_CRM],
  authors: ['claude-dev-code', 'sanket-a11y'],
  actions: [
    searchPeople,
    searchCompanies,
    reasoningSearch,
    typeahead,
    enrichProfile,
    enrichCompany,
    createCustomApiCallAction({
      auth: dataforb2bAuth,
      baseUrl: () => DATAFORB2B_API_BASE_URL,
      authMapping: async (auth) => {
        return {
          'api_key': auth.secret_text,
        };
      },
    }),

  ],
  triggers: [],
});
