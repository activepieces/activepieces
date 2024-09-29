import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { createProject } from './lib/actions/create-project';
import { createProjectMember } from './lib/actions/create-project-member';
import { listProject } from './lib/actions/list-project';
import { updateProject } from './lib/actions/update-project';
import { listProjectMember } from './lib/actions/list-project-member';
import { deleteProjectMember } from './lib/actions/delete-project-member';

const markdown = `
Activepieces Platform API is available under the Platform Edition.
(https://www.activepieces.com/docs/admin-cconsole/overview)

You can get your API Key from the Platform Dashboard.
`;

export const activePieceAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: markdown,
  required: true,
});

export const activepieces = createPiece({
  displayName: 'Activepieces Platform',
  description: 'Open source no-code business automation',

  auth: activePieceAuth,
  minimumSupportedRelease: '0.9.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/activepieces.png',
  authors: ["doskyft","abuaboud"],
  actions: [
    createProject,
    updateProject,
    listProject,
    createProjectMember,
    listProjectMember,
    deleteProjectMember,
  ],
  triggers: [],
});

export const config = {
  baseApiUrl: 'https://cloud.activepieces.com/api/v1',
};
