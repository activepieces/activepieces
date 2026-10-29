import { createAction, Property } from '@activepieces/pieces-framework';
import { gitlabAuth } from '../../auth';
import { gitlabRequest, projectPath } from '../../common/client';
import {
  requireDuration,
  optionalText,
  gitlabProps,
  requirePositiveInt,
} from '../../common/props';
import { timeStatsOutputSchema } from '../../output-schemas';

export const addIssueSpentTimeAction = createAction({
  auth: gitlabAuth,
  name: 'add_issue_spent_time',
  displayName: 'Add Spent Time',
  description: 'Logs time spent on an issue.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Adds a time-spent entry to a GitLab issue, e.g. 1h30m, with an optional summary. Not idempotent: each call adds to the total; use Reset Spent Time to wipe it.',
    idempotent: false,
  },
  props: {
    projectId: gitlabProps.projectId(),
    issueIid: gitlabProps.issueIid(),
    duration: Property.ShortText({
      displayName: 'Duration',
      description: 'GitLab duration such as 1h30m, 2d or 1w.',
      required: true,
    }),
    summary: Property.ShortText({ displayName: 'Summary', required: false }),
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
      path: `${projectPath(propsValue.projectId)}/issues/${iid}/add_spent_time`,
      body: {
        duration: requireDuration({
          value: propsValue.duration,
          label: 'Duration',
        }),
        summary: optionalText(propsValue.summary),
      },
    });
  },
});
