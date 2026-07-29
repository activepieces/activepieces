import { createPiece } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { PieceCategory } from '@activepieces/pieces-framework';
import { postcardsAuth, POSTCARDS_BASE_URL } from './lib/auth';
import { listProjects } from './lib/actions/list-projects';
import { getProject } from './lib/actions/get-project';
import { exportProject } from './lib/actions/export-project';
import { listFolders } from './lib/actions/list-folders';
import { getFolder } from './lib/actions/get-folder';
import { getUsage } from './lib/actions/get-usage';

export const postcards = createPiece({
  displayName: 'Postcards',
  description:
    'Email Builder by Designmodo. List projects and folders, check export quota, and export email designs as hosted HTML or a ZIP bundle.',
  auth: postcardsAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/postcards.png',
  categories: [PieceCategory.MARKETING],
  authors: ['designmodo'],
  actions: [
    listProjects,
    getProject,
    exportProject,
    listFolders,
    getFolder,
    getUsage,
    createCustomApiCallAction({
      baseUrl: () => `${POSTCARDS_BASE_URL}/api/v1`,
      auth: postcardsAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${(auth as { secret_text: string }).secret_text}`,
      }),
    }),
  ],
  triggers: [],
});
