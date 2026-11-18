import { createAction } from '@activepieces/pieces-framework';
import { gitlabAuth } from '../../auth';
import { gitlabRequest, projectPath } from '../../common/client';
import { gitlabProps, requirePositiveInt } from '../../common/props';
import { issueOutputSchema } from '../../output-schemas';

export const getIssueAction = createAction({
  auth: gitlabAuth,
  name: 'get_issue',
  displayName: 'Get Issue',
  description: 'Gets one issue of a project by its IID.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns one GitLab issue (title, description, state, labels, assignees, milestone, dates, web URL) by project ID/path and issue IID. Use when the issue number is known; use List Issues to find it by text or filters.',
    idempotent: true,
  },
  props: {
    projectId: gitlabProps.projectId(),
    issueIid: gitlabProps.issueIid(),
  },
  outputSchema: issueOutputSchema,
  async run({ auth, propsValue }) {
    const iid = requirePositiveInt({
      value: propsValue.issueIid,
      label: 'Issue IID',
    });
    return gitlabRequest({
      auth,
      method: 'GET',
      path: `${projectPath(propsValue.projectId)}/issues/${iid}`,
    });
  },
});
