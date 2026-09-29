import { createAction } from '@activepieces/pieces-framework';
import { linearAuth } from '../../..';
import { props } from '../../common/props';
import { linearGraphql } from '../../common/graphql';
import { LinearIssueNode, linearMappers } from '../../common/mappers';
import { ISSUE_ADD_LABEL_MUTATION } from '../../common/queries';
import { issueOutputSchema } from '../../output-schemas';

export const linearAddLabelToIssue = createAction({
  auth: linearAuth,
  name: 'linear_add_label_to_issue',
  classification: 'WRITE',
  displayName: 'Add Label to Issue',
  description: 'Add one label to an issue and keep its other labels',
  audience: 'human',
  aiMetadata: {
    description:
      'Adds one label to a Linear issue and keeps every label it already has. Use instead of Update Issue, whose Labels field replaces the whole label set. Needs the issue and the label ID (team or workspace label). Idempotent: adding a label the issue already has changes nothing.',
    idempotent: true,
  },
  props: {
    team_id: props.team_id(),
    issue_id: props.issue_reference(),
    label_id: props.label_id(),
  },
  outputSchema: issueOutputSchema,
  async run({ auth, propsValue }) {
    const id = await linearGraphql.resolveIssueId({ auth, value: propsValue.issue_id });
    const labelId = propsValue.label_id;
    if (!labelId) {
      throw new Error('Select a label.');
    }
    const data = await linearGraphql.request<{
      issueAddLabel: { success: boolean; issue: LinearIssueNode | null };
    }>({ auth, query: ISSUE_ADD_LABEL_MUTATION, variables: { id, labelId } });
    const payload = linearGraphql.requireSuccess({ payload: data.issueAddLabel, what: 'label change' });
    if (!payload.issue) {
      throw new Error('Linear did not return the updated issue.');
    }
    return linearMappers.flattenIssue(await linearGraphql.withAllIssueLabels({ auth, issue: payload.issue }));
  },
});
