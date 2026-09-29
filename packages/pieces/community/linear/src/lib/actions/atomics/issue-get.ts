import { createAction, Property } from '@activepieces/pieces-framework';
import { linearAuth } from '../../..';
import { linearGraphql } from '../../common/graphql';
import { LinearIssueNode, linearMappers } from '../../common/mappers';
import { GET_ISSUE_QUERY } from '../../common/queries';
import { atomicIssueOutputSchema } from './output-schemas';

export const linearIssueGetAtomic = createAction({
  auth: linearAuth,
  name: 'linear_issue_get',
  classification: 'READ',
  displayName: 'Get Issue (AI)',
  description: 'Get one issue by UUID or identifier.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns one Linear issue by UUID or by identifier such as ENG-123, with status, team, assignee, project, milestone, cycle, parent and labels. Use when the issue is already known; use List Issues for structured filters and Search Issues for free text. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    issue_id: Property.ShortText({
      displayName: 'Issue',
      description: 'UUID or identifier of the issue, for example ENG-123.',
      required: true,
    }),
  },
  outputSchema: atomicIssueOutputSchema,
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
    return linearMappers.flattenIssue(data.issue);
  },
});
