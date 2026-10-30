import { createAction } from '@activepieces/pieces-framework';
import { gitlabAuth } from '../../auth';
import { encodeSegment, gitlabRequest, projectPath } from '../../common/client';
import { gitlabProps } from '../../common/props';
import { branchOutputSchema } from '../../output-schemas';

export const getBranchAction = createAction({
  auth: gitlabAuth,
  name: 'get_branch',
  displayName: 'Get Branch',
  description: 'Gets one branch with its latest commit.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns one GitLab branch by name: latest commit, whether it is merged, protected or the default branch, and push/merge permissions for the connected user.',
    idempotent: true,
  },
  props: {
    projectId: gitlabProps.projectId(),
    branch: gitlabProps.branch(),
  },
  outputSchema: branchOutputSchema,
  async run({ auth, propsValue }) {
    return gitlabRequest({
      auth,
      method: 'GET',
      path: `${projectPath(
        propsValue.projectId
      )}/repository/branches/${encodeSegment({
        value: propsValue.branch,
        label: 'Branch',
      })}`,
    });
  },
});
