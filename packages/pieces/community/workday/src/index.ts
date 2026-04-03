import {
  createPiece,
  OAuth2PropertyValue,
} from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { workdayAuth } from './lib/common/auth';
import { getWorkerById } from './lib/actions/get-worker-by-id';
import { listWorkers } from './lib/actions/list-workers';
import { changeJobDetails } from './lib/actions/change-job-details';
import { getWorkerProfile } from './lib/actions/get-worker-profile';
import { getWorkerTimeOffEntries } from './lib/actions/get-worker-time-off-entries';
import { getWorkerAbsenceBalances } from './lib/actions/get-worker-absence-balances';
import { listEligibleAbsenceTypes } from './lib/actions/list-eligible-absence-types';
import { listPayGroups } from './lib/actions/list-pay-groups';
import { getWorkerPayGroups } from './lib/actions/get-worker-pay-groups';
import { newWorkerCreated } from './lib/triggers/new-worker-created';

export { workdayAuth };

export const workday = createPiece({
  displayName: 'Workday',
  description: '',
  auth: workdayAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/workday.png',
  authors: ['sanket-a11y'],
  actions: [
    getWorkerById,
    listWorkers,
    changeJobDetails,
    getWorkerProfile,
    getWorkerTimeOffEntries,
    getWorkerAbsenceBalances,
    listEligibleAbsenceTypes,
    listPayGroups,
    getWorkerPayGroups,
    createCustomApiCallAction({
      baseUrl: (auth) =>
        `https://${(auth as OAuth2PropertyValue).props!['hostname']}/ccx/api`,
      auth: workdayAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${(auth as OAuth2PropertyValue).access_token}`,
      }),
    }),
  ],
  triggers: [newWorkerCreated],
});
