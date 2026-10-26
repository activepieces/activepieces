import { createAction, Property } from '@activepieces/pieces-framework';
import { gitlabAuth } from '../../auth';
import { gitlabRequest, projectPath } from '../../common/client';
import { gitlabProps, requireText } from '../../common/props';
import { branchOutputSchema } from '../../output-schemas';

export const createBranchAction = createAction({
  auth: gitlabAuth,
  name: 'create_branch',
  displayName: 'Create Branch',
  description: 'Creates a branch from a branch, tag or commit.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Creates a new branch in a GitLab repository from an existing branch, tag or commit SHA. GitLab answers 400 if the branch already exists, so a second call fails; use Get Branch to check first.',
    idempotent: false,
  },
  props: {
    projectId: gitlabProps.projectId(),
    branch: gitlabProps.branch('Branch Name', 'Name of the new branch.'),
    ref: Property.ShortText({
      displayName: 'Create From',
      description: 'Branch, tag or commit SHA to start from.',
      required: true,
    }),
  },
  outputSchema: branchOutputSchema,
  async run({ auth, propsValue }) {
    return gitlabRequest({
      auth,
      method: 'POST',
      path: `${projectPath(propsValue.projectId)}/repository/branches`,
      body: {
        branch: requireText({ value: propsValue.branch, label: 'Branch Name' }),
        ref: requireText({ value: propsValue.ref, label: 'Create From' }),
      },
    });
  },
});
