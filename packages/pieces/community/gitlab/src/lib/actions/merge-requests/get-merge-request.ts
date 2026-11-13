import { createAction } from '@activepieces/pieces-framework';
import { gitlabAuth } from '../../auth';
import { gitlabRequest, projectPath } from '../../common/client';
import { gitlabProps, requirePositiveInt } from '../../common/props';
import { mergeRequestOutputSchema } from '../../output-schemas';

export const getMergeRequestAction = createAction({
  auth: gitlabAuth,
  name: 'get_merge_request',
  displayName: 'Get Merge Request',
  description: 'Gets one merge request of a project by its IID.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns one GitLab merge request by project and IID: title, description, branches, state, merge status, author, assignees, reviewers, SHA and web URL. Use List Merge Requests to find the IID.',
    idempotent: true,
  },
  props: {
    projectId: gitlabProps.projectId(),
    mergeRequestIid: gitlabProps.mergeRequestIid(),
  },
  outputSchema: mergeRequestOutputSchema,
  async run({ auth, propsValue }) {
    const iid = requirePositiveInt({
      value: propsValue.mergeRequestIid,
      label: 'Merge Request IID',
    });
    return gitlabRequest({
      auth,
      method: 'GET',
      path: `${projectPath(propsValue.projectId)}/merge_requests/${iid}`,
    });
  },
});
