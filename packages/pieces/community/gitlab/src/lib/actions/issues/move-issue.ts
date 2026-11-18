import { createAction, Property } from '@activepieces/pieces-framework';
import { gitlabAuth } from '../../auth';
import { gitlabRequest, projectPath } from '../../common/client';
import { gitlabProps, requirePositiveInt } from '../../common/props';
import { issueOutputSchema } from '../../output-schemas';

export const moveIssueAction = createAction({
  auth: gitlabAuth,
  name: 'move_issue',
  displayName: 'Move Issue',
  description: 'Moves an issue to another project.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Moves a GitLab issue to another project; the returned issue has a new IID in the target project and the original is closed. Not idempotent: a second call on the original IID fails because it was already moved.',
    idempotent: false,
  },
  props: {
    projectId: gitlabProps.projectId(
      'Numeric ID or full path of the project the issue is in now.'
    ),
    issueIid: gitlabProps.issueIid(),
    toProjectId: Property.Number({
      displayName: 'Target Project ID',
      description: 'Numeric ID of the destination project.',
      required: true,
    }),
  },
  outputSchema: issueOutputSchema,
  async run({ auth, propsValue }) {
    const iid = requirePositiveInt({
      value: propsValue.issueIid,
      label: 'Issue IID',
    });
    return gitlabRequest({
      auth,
      method: 'POST',
      path: `${projectPath(propsValue.projectId)}/issues/${iid}/move`,
      body: {
        to_project_id: requirePositiveInt({
          value: propsValue.toProjectId,
          label: 'Target Project ID',
        }),
      },
      statusMessages: {
        400: 'GitLab refused to move the issue (it may already be moved, or the target is the same project)',
      },
    });
  },
});
