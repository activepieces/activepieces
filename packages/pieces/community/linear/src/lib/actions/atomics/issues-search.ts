import { createAction, Property } from '@activepieces/pieces-framework';
import { linearAuth } from '../../..';
import { linearGraphql } from '../../common/graphql';
import { LinearConnection, LinearIssueNode, linearMappers } from '../../common/mappers';
import { SEARCH_ISSUES_QUERY } from '../../common/queries';
import { atomicProps } from './common';
import { atomicIssueSearchOutputSchema } from './output-schemas';

export const linearIssuesSearchAtomic = createAction({
  auth: linearAuth,
  name: 'linear_issues_search',
  classification: 'SEARCH',
  displayName: 'Search Issues (AI)',
  description: 'Full-text and semantic search over issues, best matches first.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Searches Linear issues by free text (full-text plus semantic ranking) over titles and descriptions, optionally comments, optionally limited to one team, best matches first. Use to find duplicates or an issue described in words; use List Issues for exact field filters. Rate-limited by Linear to 30 requests per minute and new issues may take a moment to be indexed. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    term: Property.ShortText({ displayName: 'Search Text', description: 'Words to search for, for example "login timeout safari".', required: true }),
    team_id: Property.ShortText({ displayName: 'Team ID', description: 'Only return issues of this team (UUID from List Teams).', required: false }),
    include_comments: Property.Checkbox({ displayName: 'Search Comments Too', required: false, defaultValue: false }),
    include_archived: Property.Checkbox({ displayName: 'Include Archived', required: false, defaultValue: false }),
    limit: atomicProps.limitProp({ fallback: 25, max: 100 }),
    cursor: atomicProps.cursorProp(),
  },
  outputSchema: atomicIssueSearchOutputSchema,
  async run({ auth, propsValue }) {
    const term = propsValue.term.trim();
    if (term.length === 0) {
      throw new Error('Search Text cannot be empty.');
    }
    const team = atomicProps.idFilter(propsValue.team_id);
    const data = await linearGraphql.request<{
      searchIssues: LinearConnection<LinearIssueNode> & { totalCount: number };
    }>({
      auth,
      query: SEARCH_ISSUES_QUERY,
      variables: {
        term,
        filter: team ? { team } : undefined,
        first: linearGraphql.clampLimit({ value: propsValue.limit, fallback: 25, max: 100 }),
        after: propsValue.cursor || undefined,
        includeComments: propsValue.include_comments === true,
        includeArchived: propsValue.include_archived === true,
      },
    });
    return {
      ...linearMappers.toPage({ connection: data.searchIssues, map: linearMappers.flattenIssue }),
      total_count: data.searchIssues.totalCount,
    };
  },
});
