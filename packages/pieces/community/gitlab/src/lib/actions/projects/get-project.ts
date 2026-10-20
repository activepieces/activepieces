import { createAction } from '@activepieces/pieces-framework';
import { gitlabAuth } from '../../auth';
import { gitlabRequest, projectPath } from '../../common/client';
import { gitlabProps } from '../../common/props';
import { projectOutputSchema } from '../../output-schemas-admin';

export const getProjectAction = createAction({
  auth: gitlabAuth,
  name: 'get_project',
  displayName: 'Get Project',
  description: 'Gets one project by ID or full path.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description: 'Returns one GitLab project by numeric ID or full path (group/project): name, numeric ID, namespace, default branch, visibility, archived flag, stars, forks and clone URLs. Use it to turn a path into the numeric project ID.',
    idempotent: true,
  },
  props: {
    projectId: gitlabProps.projectId(),
  },
  outputSchema: projectOutputSchema,
  async run({ auth, propsValue }) {
    return gitlabRequest({ auth,  method: 'GET', path: projectPath(propsValue.projectId) });
  },
});
