import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { getPersonProfileAction } from './lib/actions/get-person-profile';
import { getCompanyProfileAction } from './lib/actions/get-company-profile';
import { searchPeopleAction } from './lib/actions/search-people';
import { lookupPersonEmailAction } from './lib/actions/lookup-person-email';
import { customApiCallAction } from './lib/actions/custom-api-call';

const markdownDescription = `
To use Proxycurl:
1. Sign in to your Proxycurl account at https://nubela.co/proxycurl.
2. Open your dashboard and copy your API key.
3. Paste the API key here.

Authentication note:
- Proxycurl's public SDK/docs show Bearer token authorization for API requests.
`;

export const proxycurlAuth = PieceAuth.SecretText({
  displayName: 'Proxycurl API Key',
  description: markdownDescription,
  required: true,
});

export const proxycurl = createPiece({
  displayName: 'Proxycurl',
  description: 'Enrich LinkedIn people and company profiles with Proxycurl.',
  auth: proxycurlAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/proxycurl.png',
  categories: [PieceCategory.SALES_AND_CRM],
  authors: ['Harmatta'],
  actions: [
    getPersonProfileAction,
    getCompanyProfileAction,
    searchPeopleAction,
    lookupPersonEmailAction,
    customApiCallAction,
  ],
  triggers: [],
});
