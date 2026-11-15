import { createAction, Property } from '@activepieces/pieces-framework';
import { linearAuth } from '../../..';
import { linearGraphql } from '../../common/graphql';
import { linearMappers } from '../../common/mappers';
import { atomicIssueOutputSchema } from './output-schemas';

export const linearIssueRemoveLabelAtomic = createAction({
  auth: linearAuth,
  name: 'linear_issue_remove_label',
  classification: 'WRITE',
  displayName: 'Remove Label from Issue (AI)',
  description: 'Remove one label from an issue, keeping its other labels.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Removes one label from a Linear issue and keeps its other labels; the label itself still exists in the workspace. Use this rather than Update Issue with Label IDs, which replaces the whole set. Idempotent: removing a label the issue does not have changes nothing. labels_complete is false when Linear did not return every label page; label_ids and label_names then hold only the labels read.',
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
    const labelId = propsValue.label_id.trim();
    if (labelId.length === 0) {
      throw new Error('Label ID is required.');
    }
    const id = await linearGraphql.resolveIssueId({ auth, value: propsValue.issue_id });
    const issue = await linearGraphql.removeIssueLabel({ auth, id, labelId });
    return linearMappers.flattenIssue(issue);
  },
});
