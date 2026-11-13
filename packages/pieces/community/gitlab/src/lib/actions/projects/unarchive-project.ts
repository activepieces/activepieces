import { createAction } from '@activepieces/pieces-framework';
import { gitlabAuth } from '../../auth';
import { gitlabRequest, projectPath } from '../../common/client';
import { gitlabProps } from '../../common/props';
import { projectOutputSchema } from '../../output-schemas-admin';

export const unarchiveProjectAction = createAction({
  auth: gitlabAuth,
  name: 'unarchive_project',
  displayName: 'Unarchive Project',
  description: 'Unarchives a project so it can be changed again.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description: 'Unarchives an archived GitLab project so pushes, issues, merge requests and pipelines work again. Requires Maintainer or Owner role. Unarchiving an active project changes nothing. Reverses Archive Project.',
    idempotent: true,
  },
  props: {
    projectId: gitlabProps.projectId(),
  },
  outputSchema: projectOutputSchema,
  async run({ auth, propsValue }) {
    return gitlabRequest({ auth,  method: 'POST', path: `${projectPath(propsValue.projectId)}/unarchive` });
  },
});
