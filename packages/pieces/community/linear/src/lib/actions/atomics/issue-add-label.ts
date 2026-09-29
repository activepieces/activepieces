import { createAction, Property } from '@activepieces/pieces-framework';
import { linearAuth } from '../../..';
import { linearGraphql } from '../../common/graphql';
import { LinearIssueNode, linearMappers } from '../../common/mappers';
import { ISSUE_ADD_LABEL_MUTATION } from '../../common/queries';
import { atomicIssueOutputSchema } from './output-schemas';

export const linearIssueAddLabelAtomic = createAction({
  auth: linearAuth,
  name: 'linear_issue_add_label',
  classification: 'WRITE',
  displayName: 'Add Label to Issue (AI)',
  description: 'Add one label to an issue, keeping its other labels.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Adds one label (team or workspace) to a Linear issue and keeps the labels it already has. Use this rather than Update Issue with Label IDs, which replaces the whole set. Resolve the label with List Issue Labels or create it with Create Issue Label. Idempotent: adding a label the issue already has changes nothing.',
    idempotent: true,
  },
  props: {
    issue_id: Property.ShortText({
      displayName: 'Issue',
      description: 'UUID or identifier of the issue, for example ENG-123.',
      required: true,
    }),
    label_id: Property.ShortText({
      displayName: 'Label ID',
      description: 'UUID of the label. Get it from List Issue Labels.',
      required: true,
    }),
  },
  outputSchema: atomicIssueOutputSchema,
  async run({ auth, propsValue }) {
    const id = await linearGraphql.resolveIssueId({ auth, value: propsValue.issue_id });
    const labelId = propsValue.label_id.trim();
    if (labelId.length === 0) {
      throw new Error('Label ID is required.');
    }
    const data = await linearGraphql.request<{
      issueAddLabel: { success: boolean; issue: LinearIssueNode | null };
    }>({ auth, query: ISSUE_ADD_LABEL_MUTATION, variables: { id, labelId } });
    const payload = linearGraphql.requireSuccess({ payload: data.issueAddLabel, what: 'label change' });
    if (!payload.issue) {
      throw new Error('Linear did not return the updated issue.');
    }
    return linearMappers.flattenIssue(payload.issue);
  },
});
