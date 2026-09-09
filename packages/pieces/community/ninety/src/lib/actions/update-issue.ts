import {
  createAction,
  Property,
  spreadIfDefined,
} from '@activepieces/pieces-framework';
import { ninetyAuth } from '../auth';
import { ninetyCommon } from '../common/client';
import { ninetyPropUtils, ninetyProps } from '../common/props';
import { issueOutputSchema } from '../common/output-schemas';

export const updateIssue = createAction({
  auth: ninetyAuth,
  name: 'update_issue',
  classification: 'WRITE',
  displayName: 'Update Issue',
  description: 'Change an issue, move it between terms, or solve it',
  audience: 'both',
  aiMetadata: {
    description:
      'Updates one Ninety issue by id. Only the fields you set are sent. Marking it completed is how an issue is solved, and changing the term moves it between the weekly list and the parking lot. Safe to retry.',
    idempotent: true,
  },
  outputSchema: issueOutputSchema,
  props: {
    issueId: Property.ShortText({
      displayName: 'Issue ID',
      description: 'The id of the issue to update',
      required: true,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      required: false,
    }),
    teamId: ninetyProps.teamIdMove,
    interval: ninetyProps.intervalCode,
    priority: ninetyProps.issuePriority,
    completed: ninetyProps.completedSetter,
    description: Property.LongText({
      displayName: 'Description',
      description: 'Ninety renders this as HTML',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const issue = await ninetyCommon.updateIssue({
      token: auth.secret_text,
      issueId: propsValue.issueId,
      issue: {
        ...spreadIfDefined('title', propsValue.title),
        ...spreadIfDefined('teamId', propsValue.teamId),
        ...spreadIfDefined('interval', propsValue.interval),
        ...spreadIfDefined('description', propsValue.description),
        ...spreadIfDefined(
          'priority',
          ninetyPropUtils.toOptionalNumber(propsValue.priority)
        ),
        ...spreadIfDefined(
          'completed',
          ninetyPropUtils.triStateToBoolean(propsValue.completed)
        ),
      },
    });
    return issue;
  },
});
