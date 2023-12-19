
import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { createProject } from './lib/actions/create-project';
import { createProjectMember } from './lib/actions/create-project-member';
import { listProject } from './lib/actions/list-project';
import { updateProject } from './lib/actions/update-project';
import { listProjectMember } from './lib/actions/list-project-member';
import { deleteProjectMember } from './lib/actions/delete-project-member';

export const activePieceAuth = PieceAuth.SecretText({
  displayName: 'Secret Text',
  description: 'Secret text to be used for authentication',
  required: true,
})

export const activepieces = createPiece({
  displayName: "Activepieces",
  auth: activePieceAuth,
  minimumSupportedRelease: '0.9.0',
  logoUrl: "https://cdn.activepieces.com/pieces/activepieces.png",
  authors: ["doskyft"],
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
  baseApiUrl: "https://cloud.activepieces.com/api/v1",
}
