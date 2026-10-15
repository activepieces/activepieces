import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { weincAuth } from './lib/auth';
import { WEINC_BASE_URL } from './lib/common/client';
import { createProject } from './lib/actions/create-project';
import { getProject } from './lib/actions/get-project';
import { listProjects } from './lib/actions/list-projects';
import { updateProject } from './lib/actions/update-project';
import { getPreviewUrls } from './lib/actions/get-preview-urls';
import { createClient } from './lib/actions/create-client';
import { listClients } from './lib/actions/list-clients';
import { newProject } from './lib/triggers/new-project';

export const weinc = createPiece({
  displayName: 'WeInc',
  description: 'AI website builder. Manage website projects, preview links and client accounts.',
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/weinc.png',
  categories: [PieceCategory.PRODUCTIVITY],
  auth: weincAuth,
  authors: ['umairalisadaqat'],
  actions: [
    createProject,
    getProject,
    listProjects,
    updateProject,
    getPreviewUrls,
    createClient,
    listClients,
    createCustomApiCallAction({
      baseUrl: () => WEINC_BASE_URL,
      auth: weincAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth.secret_text}`,
      }),
    }),
  ],
  triggers: [newProject],
});
