import { createAction } from '@activepieces/pieces-framework';
import { gitlabAuth } from '../../auth';
import { resetIssueSpentTime } from '../../common/irreversible';
import { gitlabProps, requirePositiveInt } from '../../common/props';
import { timeStatsOutputSchema } from '../../output-schemas';

export const resetIssueSpentTimeAction = createAction({
  auth: gitlabAuth,
  name: 'reset_issue_spent_time',
  displayName: 'Reset Spent Time',
  description: 'Clears all time spent logged on an issue.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Deletes every time-spent entry on a GitLab issue and sets the total to zero; the logged history cannot be restored. Calling it again leaves the total at zero.',
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
    return resetIssueSpentTime({
      auth,
      projectId: propsValue.projectId,
      issueIid: iid,
    });
  },
});
