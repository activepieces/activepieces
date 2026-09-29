import { createAction, Property } from '@activepieces/pieces-framework';
import { linearAuth } from '../../..';
import { linearGraphql } from '../../common/graphql';
import { LinearIssueNode, linearMappers } from '../../common/mappers';
import { GET_ISSUE_QUERY } from '../../common/queries';
import { issueOutputSchema } from '../../output-schemas';

export const linearGetIssue = createAction({
  auth: linearAuth,
  name: 'linear_get_issue',
  classification: 'READ',
  displayName: 'Get Issue',
  description: 'Get an issue by its ID or identifier (for example ENG-123)',
  audience: 'human',
  aiMetadata: {
    description:
      'Fetches one Linear issue by its UUID or its human identifier such as ENG-123, returning status, team, assignee, project, cycle, parent and labels. Use when a flow already holds an issue reference (from Slack, email or GitHub) and needs its current details; use Search Issues to find issues by text. Read-only and idempotent. labels_complete is false when Linear did not return every label page; label_ids and label_names then hold only the labels read.',
    idempotent: true,
  },
  props: {
    issue_id: Property.ShortText({
      displayName: 'Issue ID or Identifier',
      description: 'The issue identifier shown in Linear (for example ENG-123) or the issue UUID.',
      required: true,
    }),
  },
  outputSchema: issueOutputSchema,
  async run({ auth, propsValue }) {
    const id = propsValue.issue_id.trim();
    if (!linearGraphql.isUuid(id) && !linearGraphql.isIssueIdentifier(id)) {
      throw new Error(`"${id}" is not an issue UUID or an identifier like ENG-123.`);
    }
    const data = await linearGraphql.request<{ issue: LinearIssueNode | null }>({
      auth,
      query: GET_ISSUE_QUERY,
      variables: { id: linearGraphql.isUuid(id) ? id : id.toUpperCase() },
    });
    if (!data.issue) {
      throw new Error(`No Linear issue found for ${id}.`);
    }
    return linearMappers.flattenIssue(await linearGraphql.withAllIssueLabels({ auth, issue: data.issue }));
  },
});
