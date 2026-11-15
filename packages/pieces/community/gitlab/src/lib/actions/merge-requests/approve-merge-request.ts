import { createAction, Property } from '@activepieces/pieces-framework';
import { gitlabAuth } from '../../auth';
import { gitlabRequest, projectPath } from '../../common/client';
import {
  gitlabProps,
  optionalText,
  requirePositiveInt,
} from '../../common/props';
import { approvalsOutputSchema } from '../../output-schemas';

export const approveMergeRequestAction = createAction({
  auth: gitlabAuth,
  name: 'approve_merge_request',
  displayName: 'Approve Merge Request',
  description: 'Approves a merge request as the connected user.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      "Adds the connected user's approval to a GitLab merge request. GitLab answers 401 if this user already approved it or may not approve it (on gitlab.com authors usually cannot approve their own merge request), so check user_can_approve with Get Merge Request Approvals first. Undo with Unapprove Merge Request.",
    idempotent: false,
  },
  props: {
    projectId: gitlabProps.projectId(),
    mergeRequestIid: gitlabProps.mergeRequestIid(),
    sha: Property.ShortText({
      displayName: 'Expected Head SHA',
      description:
        'If set, the approval fails when the source branch head is not this SHA.',
      required: false,
    }),
  },
  outputSchema: approvalsOutputSchema,
  async run({ auth, propsValue }) {
    const iid = requirePositiveInt({
      value: propsValue.mergeRequestIid,
      label: 'Merge Request IID',
    });
    return gitlabRequest({
      auth,
      method: 'POST',
      path: `${projectPath(
        propsValue.projectId
      )}/merge_requests/${iid}/approve`,
      body: { sha: optionalText(propsValue.sha) },
      statusMessages: {
        401: 'GitLab refused the approval: the connected user already approved this merge request or is not allowed to approve it (authors usually cannot approve their own)',
        409: 'The source branch head does not match the expected SHA',
      },
    });
  },
});
