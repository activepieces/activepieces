import { createAction } from '@activepieces/pieces-framework';
import { gitlabAuth } from '../../auth';
import { encodeSegment, gitlabRequest, projectPath } from '../../common/client';
import { gitlabProps, requireText } from '../../common/props';
import { deletedBranchOutputSchema } from '../../output-schemas';

export const deleteBranchAction = createAction({
  auth: gitlabAuth,
  name: 'delete_branch',
  displayName: 'Delete Branch',
  description: 'Deletes a branch from the repository.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Deletes one branch from a GitLab repository; commits only on that branch become unreachable. Protected and default branches cannot be deleted. A second call fails with not found.',
    idempotent: false,
  },
  props: {
    projectId: gitlabProps.projectId(),
    branch: gitlabProps.branch(),
  },
  outputSchema: deletedBranchOutputSchema,
  async run({ auth, propsValue }) {
    const branch = requireText({ value: propsValue.branch, label: 'Branch' });
    await gitlabRequest({
      auth,
      method: 'DELETE',
      path: `${projectPath(
        propsValue.projectId
      )}/repository/branches/${encodeSegment({
        value: branch,
        label: 'Branch',
      })}`,
      statusMessages: {
        403: 'GitLab refused to delete the branch: it is protected or the default branch, or the user lacks permission',
      },
    });
    return { deleted: true, branch };
  },
});
