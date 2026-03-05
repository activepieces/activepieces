import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { knowbe4Auth, KNOWBE4_REGIONS } from './lib/auth';
import { listUsers } from './lib/actions/list-users';
import { getUser } from './lib/actions/get-user';
import { listGroups } from './lib/actions/list-groups';
import { listTrainingCampaigns } from './lib/actions/list-training-campaigns';
import { listTrainingEnrollments } from './lib/actions/list-training-enrollments';
import { listPhishingCampaigns } from './lib/actions/list-phishing-campaigns';
import { getAccount } from './lib/actions/get-account';
import { newUser } from './lib/triggers/new-user';
import { newTrainingEnrollment } from './lib/triggers/new-training-enrollment';

export const knowbe4 = createPiece({
  displayName: 'KnowBe4',
  description:
    'Security awareness training and simulated phishing platform',
  auth: knowbe4Auth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/knowbe4.png',
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  authors: [],
  actions: [
    listUsers,
    getUser,
    listGroups,
    listTrainingCampaigns,
    listTrainingEnrollments,
    listPhishingCampaigns,
    getAccount,
    createCustomApiCallAction({
      baseUrl: (auth) => {
        const kb4Auth = auth as { apiKey: string; region: string };
        return `${KNOWBE4_REGIONS[kb4Auth.region] ?? KNOWBE4_REGIONS['us']}/v1`;
      },
      auth: knowbe4Auth,
      authMapping: async (auth) => {
        const kb4Auth = auth as { apiKey: string; region: string };
        return {
          Authorization: `Bearer ${kb4Auth.apiKey}`,
        };
      },
    }),
  ],
  triggers: [newUser, newTrainingEnrollment],
});
