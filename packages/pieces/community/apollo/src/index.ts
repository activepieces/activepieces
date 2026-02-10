import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { matchPerson } from './lib/actions/match-person';
import { enrichCompany } from './lib/actions/enrich-company';
import { newsArticlesSearch } from './lib/actions/news-articles-search';
import { organizationJobPostings } from './lib/actions/organization-job-postings';
import { organizationSearch } from './lib/actions/organization-search';
import { peopleSearch } from './lib/actions/people-search';
import { createCustomApiCallAction } from '@activepieces/pieces-common';

export const apolloAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: `
To create your Apollo API key:

1. Go to **Settings** > **[Integrations](https://app.apollo.io/#/settings/integrations)** in Apollo
2. Click **Connect** beside Apollo API
3. Click **API Keys** > **Create new key**
4. Enter a name and description, then select the endpoints you need (or toggle **Set as master key** for full access)
5. Click **Create API key** and copy it to a secure location

**Note:** Some endpoints require a master API key. Keep your API keys secure and be careful with whom you share access.

[Learn more about creating API keys](https://docs.apollo.io/docs/create-api-key)
  `,
  required: true,
});

export const apollo = createPiece({
  displayName: 'Apollo',
  auth: apolloAuth,
  description:
    'AI sales platform for prospecting, lead gen, and deal automation. Close more deals, faster, with smart data.',
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/apollo.png',
  authors: ['abuaboud', 'sanket-a11y'],
  actions: [
    matchPerson,
    enrichCompany,
    newsArticlesSearch,
    organizationJobPostings,
    organizationSearch,
    peopleSearch,
    createCustomApiCallAction({
      auth: apolloAuth,
      baseUrl: () => 'https://api.apollo.io/api/v1',
      authMapping: async (auth) => {
        return {
          'x-api-key': auth.secret_text,
        };
      },
    }),
  ],
  triggers: [],
});
