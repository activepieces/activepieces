import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';

import { createApplicationAction } from './lib/actions/create-application';
import { createCandidateAction } from './lib/actions/create-candidate';
import { getCandidateAction } from './lib/actions/get-candidate';
import { getJobAction } from './lib/actions/get-job';
import { listJobsAction } from './lib/actions/list-jobs';
import { greenhouseAuth } from './lib/auth';
import { GREENHOUSE_BASE_URL, greenhouseBasicAuthHeader } from './lib/common/client';

export const greenhouse = createPiece({
  displayName: 'Greenhouse',
  description: 'Greenhouse Harvest API for recruiting workflows, candidates, applications, and jobs.',
  auth: greenhouseAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://developers.greenhouse.io/images/favicons/favicon.ico',
  authors: ['Harmatta'],
  categories: [PieceCategory.HUMAN_RESOURCES],
  actions: [
    createApplicationAction,
    createCandidateAction,
    getCandidateAction,
    getJobAction,
    listJobsAction,
    createCustomApiCallAction({
      auth: greenhouseAuth,
      baseUrl: () => GREENHOUSE_BASE_URL,
      authMapping: async (auth) => ({
        Authorization: greenhouseBasicAuthHeader(auth.secret_text),
      }),
    }),
  ],
  triggers: [],
});
