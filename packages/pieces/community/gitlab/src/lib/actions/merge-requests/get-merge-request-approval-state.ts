import { createAction } from '@activepieces/pieces-framework';
import { gitlabAuth } from '../../auth';
import { gitlabRequest, projectPath } from '../../common/client';
import { gitlabProps, requirePositiveInt } from '../../common/props';
import { approvalStateOutputSchema } from '../../output-schemas-admin';

export const getMergeRequestApprovalStateAction = createAction({
  auth: gitlabAuth,
  name: 'get_merge_request_approval_state',
  displayName: 'Get Merge Request Approval Rules',
  description: 'Gets the approval rules of a merge request and which are satisfied. Rules need GitLab Premium or Ultimate.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description: 'Returns the approval rules that apply to a GitLab merge request (eligible approvers, approvals required per rule, who approved, whether each rule is met). Rules are a GitLab Premium or Ultimate feature; on Free the list is empty or the call fails with 403 or 404, so use Get Merge Request Approvals there.',
    idempotent: true,
  },
  props: {
    projectId: gitlabProps.projectId(),
    mergeRequestIid: gitlabProps.mergeRequestIid(),
  },
  outputSchema: approvalStateOutputSchema,
  async run({ auth, propsValue }) {
    const iid = requirePositiveInt({ value: propsValue.mergeRequestIid, label: 'Merge Request IID' });
    return gitlabRequest({ auth, 
      method: 'GET',
      path: `${projectPath(propsValue.projectId)}/merge_requests/${iid}/approval_state`,
      statusMessages: {
        403: 'Approval rules need GitLab Premium or Ultimate on this project, or the connected user lacks access',
        404: 'GitLab could not find the merge request, or approval rules are not available on this GitLab plan',
      },
    });
  },
});
