import { createAction } from '@activepieces/pieces-framework';
import { gitlabAuth } from '../../auth';
import { gitlabProps } from '../../common/props';
import { projectStarOutputSchema } from '../../output-schemas-admin';
import { toggleStar } from './star-project';

export const unstarProjectAction = createAction({
  auth: gitlabAuth,
  name: 'unstar_project',
  displayName: 'Unstar Project',
  description: 'Removes the connected user star from a project.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description: 'Removes the connected user star from a GitLab project. If it is not starred the call succeeds with unchanged true. Reverses Star Project.',
    idempotent: true,
  },
  props: {
    projectId: gitlabProps.projectId(),
  },
  outputSchema: projectStarOutputSchema,
  async run({ auth, propsValue }) {
    return toggleStar({ auth, projectId: propsValue.projectId, verb: 'unstar' });
  },
});
