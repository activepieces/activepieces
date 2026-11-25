import { createPiece } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { captainDataAuth, CaptainDataAuthType } from './lib/auth';
import { CAPTAIN_DATA_BASE_URL } from './lib/common';
import { launchWorkflow } from './lib/actions/launch-workflow';
import { getJobResults } from './lib/actions/get-job-results';
import { findPerson } from './lib/actions/find-person';
import { searchPeople } from './lib/actions/search-people';
import { enrichPerson } from './lib/actions/enrich-person';
import { listPersonExperiences } from './lib/actions/list-person-experiences';
import { listPersonSkills } from './lib/actions/list-person-skills';
import { listPersonCertifications } from './lib/actions/list-person-certifications';
import { findCompany } from './lib/actions/find-company';
import { searchCompanies } from './lib/actions/search-companies';
import { enrichCompany } from './lib/actions/enrich-company';
import { findCompanyEmployees } from './lib/actions/find-company-employees';
import { getQuotas } from './lib/actions/get-quotas';

const captainData = createPiece({
  displayName: 'Captain Data',
  description:
    'Find, search and enrich people and companies from LinkedIn and Sales Navigator data.',
  auth: captainDataAuth,
  minimumSupportedRelease: '0.88.2',
  logoUrl: 'https://cdn.activepieces.com/pieces/captain-data.png',
  authors: ['AdamSelene'],
  actions: [
    findPerson,
    searchPeople,
    enrichPerson,
    listPersonExperiences,
    listPersonSkills,
    listPersonCertifications,
    findCompany,
    searchCompanies,
    enrichCompany,
    findCompanyEmployees,
    getQuotas,
    launchWorkflow,
    getJobResults,
    createCustomApiCallAction({
      auth: captainDataAuth,
      baseUrl: () => CAPTAIN_DATA_BASE_URL,
      authMapping: async (auth) => ({
        'X-API-Key': auth.props.apiKey.trim(),
      }),
    }),
  ],
  triggers: [],
});

export { captainData, captainDataAuth, CAPTAIN_DATA_BASE_URL };
export type { CaptainDataAuthType };
