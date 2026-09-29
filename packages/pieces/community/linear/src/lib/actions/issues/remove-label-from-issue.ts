import { createAction } from '@activepieces/pieces-framework';
import { linearAuth } from '../../..';
import { props } from '../../common/props';
import { linearGraphql } from '../../common/graphql';
import { linearMappers } from '../../common/mappers';
import { issueOutputSchema } from '../../output-schemas';

export const linearRemoveLabelFromIssue = createAction({
  auth: linearAuth,
  name: 'linear_remove_label_from_issue',
  classification: 'WRITE',
  displayName: 'Remove Label from Issue',
  description: 'Remove one label from an issue and keep its other labels',
  audience: 'both',
  aiMetadata: {
    description:
      'Removes one label from a Linear issue and keeps its other labels; the label itself is not deleted. Use instead of Update Issue, whose Labels field replaces the whole label set. Needs the issue and the label ID. Idempotent: removing a label the issue does not have changes nothing.',
    idempotent: true,
  },
  props: {
    team_id: props.team_id(),
    issue_id: props.issue_id(),
    label_id: props.label_id(),
  },
  outputSchema: issueOutputSchema,
  async run({ auth, propsValue }) {
    const id = await linearGraphql.resolveIssueId({ auth, value: propsValue.issue_id });
    const labelId = propsValue.label_id;
    if (!labelId) {
      throw new Error('Select a label.');
    }
    const issue = await linearGraphql.removeIssueLabel({ auth, id, labelId });
    return linearMappers.flattenIssue(issue);
  },
});
