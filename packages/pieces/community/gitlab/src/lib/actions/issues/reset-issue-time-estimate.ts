import { createAction } from '@activepieces/pieces-framework';
import { gitlabAuth } from '../../auth';
import { gitlabRequest, projectPath } from '../../common/client';
import { gitlabProps, requirePositiveInt } from '../../common/props';
import { timeStatsOutputSchema } from '../../output-schemas';

export const resetIssueTimeEstimateAction = createAction({
  auth: gitlabAuth,
  name: 'reset_issue_time_estimate',
  displayName: 'Reset Time Estimate',
  description: 'Removes the time estimate of an issue.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Removes the time estimate of a GitLab issue (sets it to zero). Logged time spent is not affected.',
    idempotent: true,
  },
  props: {
    projectId: gitlabProps.projectId(),
    issueIid: gitlabProps.issueIid(),
  },
  outputSchema: timeStatsOutputSchema,
  async run({ auth, propsValue }) {
    const iid = requirePositiveInt({
      value: propsValue.issueIid,
      label: 'Issue IID',
    });
    return gitlabRequest({
      auth,
      method: 'POST',
      path: `${projectPath(
        propsValue.projectId
      )}/issues/${iid}/reset_time_estimate`,
    });
  },
});
