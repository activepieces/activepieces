import { createAction } from '@activepieces/pieces-framework';
import { gitlabAuth } from '../../auth';
import { gitlabRequest, projectPath } from '../../common/client';
import { gitlabProps, requirePositiveInt } from '../../common/props';
import { approvalsOutputSchema } from '../../output-schemas';

export const unapproveMergeRequestAction = createAction({
  auth: gitlabAuth,
  name: 'unapprove_merge_request',
  displayName: 'Unapprove Merge Request',
  description: "Removes the connected user's approval from a merge request.",
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      "Withdraws the connected user's approval from a GitLab merge request. GitLab answers 404 if the user had not approved it, so a second call fails.",
    idempotent: false,
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
      method: 'POST',
      path: `${projectPath(
        propsValue.projectId
      )}/merge_requests/${iid}/unapprove`,
      statusMessages: {
        404: 'The connected user has not approved this merge request, or it was not found',
      },
    });
  },
});
