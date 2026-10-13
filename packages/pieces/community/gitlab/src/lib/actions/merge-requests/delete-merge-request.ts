import { createAction } from '@activepieces/pieces-framework';
import { gitlabAuth } from '../../auth';
import { gitlabRequest, projectPath } from '../../common/client';
import { gitlabProps, requirePositiveInt } from '../../common/props';
import { deletedMergeRequestOutputSchema } from '../../output-schemas';

export const deleteMergeRequestAction = createAction({
  auth: gitlabAuth,
  name: 'delete_merge_request',
  displayName: 'Delete Merge Request',
  description:
    'Permanently deletes a merge request. Requires the Owner role or admin.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Permanently deletes a GitLab merge request with its discussion; only project Owners or admins may do it. To stop a merge request without losing it, use Update Merge Request with State Change Close instead.',
    idempotent: false,
  },
  props: {
    projectId: gitlabProps.projectId(),
    mergeRequestIid: gitlabProps.mergeRequestIid(),
  },
  outputSchema: deletedMergeRequestOutputSchema,
  async run({ auth, propsValue }) {
    const iid = requirePositiveInt({
      value: propsValue.mergeRequestIid,
      label: 'Merge Request IID',
    });
    await gitlabRequest({
      auth,
      method: 'DELETE',
      path: `${projectPath(propsValue.projectId)}/merge_requests/${iid}`,
      statusMessages: {
        403: 'Only project Owners or admins can delete merge requests',
      },
    });
    return { deleted: true, mergeRequestIid: iid };
  },
});
