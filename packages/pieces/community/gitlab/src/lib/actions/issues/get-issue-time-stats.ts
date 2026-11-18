import { createAction } from '@activepieces/pieces-framework';
import { gitlabAuth } from '../../auth';
import { gitlabRequest, projectPath } from '../../common/client';
import { gitlabProps, requirePositiveInt } from '../../common/props';
import { timeStatsOutputSchema } from '../../output-schemas';

export const getIssueTimeStatsAction = createAction({
  auth: gitlabAuth,
  name: 'get_issue_time_stats',
  displayName: 'Get Time Tracking Stats',
  description: 'Gets the time estimate and time spent of an issue.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns the time estimate and total time spent on a GitLab issue, in seconds and in human-readable form.',
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
      method: 'GET',
      path: `${projectPath(propsValue.projectId)}/issues/${iid}/time_stats`,
    });
  },
});
