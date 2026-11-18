import { createAction } from '@activepieces/pieces-framework';
import { gitlabAuth } from '../../auth';
import { gitlabRequest, projectPath } from '../../common/client';
import { gitlabProps, requirePositiveInt } from '../../common/props';
import { approvalsOutputSchema } from '../../output-schemas';

export const getMergeRequestApprovalsAction = createAction({
  auth: gitlabAuth,
  name: 'get_merge_request_approvals',
  displayName: 'Get Merge Request Approvals',
  description: 'Gets who approved a merge request and whether it is approved.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns the approval status of a GitLab merge request: whether it is approved, approvals required and left, and the users who approved. Works on every GitLab tier. Check it before Approve Merge Request to avoid a duplicate-approval error.',
    idempotent: true,
  },
  props: {
    projectId: gitlabProps.projectId(),
    mergeRequestIid: gitlabProps.mergeRequestIid(),
  },
  outputSchema: approvalsOutputSchema,
  async run({ auth, propsValue }) {
    const iid = requirePositiveInt({
      value: propsValue.mergeRequestIid,
      label: 'Merge Request IID',
    });
    return gitlabRequest({
      auth,
      method: 'GET',
      path: `${projectPath(
        propsValue.projectId
      )}/merge_requests/${iid}/approvals`,
    });
  },
});
