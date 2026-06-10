import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPersonAction } from './lib/actions/create-person';
import { createCompanyAction } from './lib/actions/create-company';
import { createProjectAction } from './lib/actions/create-project';
import { createSubprojectAction } from './lib/actions/create-subproject';
import { deactivateSubprojectAction } from './lib/actions/deactivate-subproject';
import { createMultipleTimeEntriesAction } from './lib/actions/create-multiple-time-entries';
import { deleteMultipleTimeEntriesAction } from './lib/actions/delete-multiple-time-entries';
import { beeboleAuth } from './lib/common/auth';

export const beebole = createPiece({
  displayName: 'Beebole',
  description:
    'Time tracking and project management. Create companies, projects, people, and log time entries.',
  auth: beeboleAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/beebole.png',
  categories: [PieceCategory.PRODUCTIVITY, PieceCategory.HUMAN_RESOURCES],
  authors: ['sanket-a11y'],
  actions: [
    createPersonAction,
    createCompanyAction,
    createProjectAction,
    createSubprojectAction,
    deactivateSubprojectAction,
    createMultipleTimeEntriesAction,
    deleteMultipleTimeEntriesAction,
    createCustomApiCallAction({
      baseUrl: () => 'https://beebole-apps.com/api/v2',
      auth: beeboleAuth,
      authMapping: async (auth) => ({
        Authorization: `Basic ${Buffer.from(
          `${auth as unknown as string}:x`
        ).toString('base64')}`,
      }),
    }),
  ],
  triggers: [],
});
