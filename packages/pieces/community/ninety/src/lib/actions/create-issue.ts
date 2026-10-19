import {
  createAction,
  Property,
  spreadIfDefined,
} from '@activepieces/pieces-framework';
import { ninetyAuth } from '../auth';
import { ninetyCommon } from '../common/client';
import { ninetyPropUtils, ninetyProps } from '../common/props';
import { issueOutputSchema } from '../common/output-schemas';

export const createIssue = createAction({
  auth: ninetyAuth,
  name: 'create_issue',
  classification: 'WRITE',
  displayName: 'Create Issue',
  description: 'Raise an issue on a Ninety team issues list',
  audience: 'both',
  aiMetadata: {
    description:
      'Creates one Ninety issue on a team. A team is required, unlike a to-do, and short term issues go to the weekly list while long term ones go to the parking lot. Each call creates a new issue, so retries duplicate.',
    idempotent: false,
  },
  outputSchema: issueOutputSchema,
  props: {
    title: Property.ShortText({
      displayName: 'Title',
      description: 'The issue headline',
      required: true,
    }),
    teamId: ninetyProps.teamIdRequired,
    interval: ninetyProps.intervalCode,
    priority: ninetyProps.issuePriority,
    userId: ninetyProps.ownerId,
    description: Property.LongText({
      displayName: 'Description',
      description: 'Ninety renders this as HTML',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const issue = await ninetyCommon.createIssue({
      token: auth.secret_text,
      issue: {
        title: propsValue.title,
        teamId: propsValue.teamId,
        ...spreadIfDefined('interval', propsValue.interval),
        ...spreadIfDefined('description', propsValue.description),
        ...spreadIfDefined('userId', propsValue.userId),
        ...spreadIfDefined(
          'priority',
          ninetyPropUtils.toOptionalNumber(propsValue.priority)
        ),
      },
    });
    return issue;
  },
});
