import { createPiece } from '@activepieces/pieces-framework';
import { addTarget } from './lib/actions/add-target';
import { startScan } from './lib/actions/start-scan';
import { intruderAuth } from './lib/common/auth';
import { searchForATarget } from './lib/actions/search-for-a-target';
import { searchForAnIssue } from './lib/actions/search-for-an-issue';
import { searchForAnIssueOccurrence } from './lib/actions/search-for-an-issue-occurrence';
import { newIssue } from './lib/triggers/new-issue';
import { scanComplete } from './lib/triggers/scan-complete';
import { createCustomApiCallAction } from '@activepieces/pieces-common';

export const intruder = createPiece({
  displayName: 'Intruder',
  auth: intruderAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/intruder.png',
  authors: ['sanket-a11y'],
  actions: [
    addTarget,
    startScan,
    searchForATarget,
    searchForAnIssue,
    searchForAnIssueOccurrence,
    createCustomApiCallAction({
      auth: intruderAuth,
      baseUrl: () => 'https://api.intruder.io/v1',
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth.secret_text}`,
      }),
    }),
  ],
  triggers: [newIssue, scanComplete],
});
