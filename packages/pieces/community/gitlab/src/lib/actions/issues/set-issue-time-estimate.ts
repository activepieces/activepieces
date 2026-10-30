import { createAction, Property } from '@activepieces/pieces-framework';
import { gitlabAuth } from '../../auth';
import { gitlabRequest, projectPath } from '../../common/client';
import {
  requireDuration,
  gitlabProps,
  requirePositiveInt,
} from '../../common/props';
import { timeStatsOutputSchema } from '../../output-schemas';

export const setIssueTimeEstimateAction = createAction({
  auth: gitlabAuth,
  name: 'set_issue_time_estimate',
  displayName: 'Set Time Estimate',
  description: 'Sets the time estimate of an issue.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Sets the time estimate of a GitLab issue to a duration such as 3h30m, replacing any previous estimate. Use Reset Time Estimate to remove it.',
    idempotent: true,
  },
  props: {
    projectId: gitlabProps.projectId(),
    issueIid: gitlabProps.issueIid(),
    duration: Property.ShortText({
      displayName: 'Estimate',
      description: 'GitLab duration such as 3h30m, 2d or 1w.',
      required: true,
    }),
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
      path: `${projectPath(propsValue.projectId)}/issues/${iid}/time_estimate`,
      body: {
        duration: requireDuration({
          value: propsValue.duration,
          label: 'Estimate',
        }),
      },
    });
  },
});
