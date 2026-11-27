import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { estimateSalaryAction } from './lib/actions/estimate-salary';
import { getCompanyHiringSignalsAction } from './lib/actions/get-company-hiring-signals';
import { getJobDetailsAction } from './lib/actions/get-job-details';
import { searchJobsAction } from './lib/actions/search-jobs';
import { jobvettaAuth } from './lib/auth';
import { formatBearerHeader, JOBVETTA_BASE_URL } from './lib/common/client';
import { newJobMatchingSearchTrigger } from './lib/triggers/new-job-matching-search';

export const jobvetta = createPiece({
  displayName: 'Jobvetta',
  description: 'Search 6.5M+ live verified employer career-site job postings, company hiring velocity signals, and market salary benchmarks across 242 countries.',
  auth: jobvettaAuth,
  minimumSupportedRelease: '0.88.2',
  logoUrl: 'https://www.jobvetta.com/icon-192.png',
  categories: [PieceCategory.HUMAN_RESOURCES, PieceCategory.SALES_AND_CRM],
  authors: ['jobvetta'],
  actions: [
    searchJobsAction,
    getCompanyHiringSignalsAction,
    estimateSalaryAction,
    getJobDetailsAction,
    createCustomApiCallAction({
      baseUrl: () => JOBVETTA_BASE_URL,
      auth: jobvettaAuth,
      authMapping: async (auth) => ({
        Authorization: formatBearerHeader(auth.secret_text),
      }),
    }),
  ],
  triggers: [newJobMatchingSearchTrigger],
});
