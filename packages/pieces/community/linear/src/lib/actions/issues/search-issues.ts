import { createAction, Property } from '@activepieces/pieces-framework';
import { linearAuth } from '../../..';
import { props } from '../../common/props';
import { linearGraphql } from '../../common/graphql';
import { LinearConnection, LinearIssueNode, linearMappers } from '../../common/mappers';
import { SEARCH_ISSUES_QUERY } from '../../common/queries';
import { issueSearchOutputSchema } from '../../output-schemas';

export const linearSearchIssues = createAction({
  auth: linearAuth,
  name: 'linear_search_issues',
  classification: 'SEARCH',
  displayName: 'Search Issues',
  description: 'Search issues by text, optionally in one team',
  audience: 'human',
  aiMetadata: {
    description:
      'Runs a Linear full-text and semantic search over issue titles and descriptions (optionally comments), optionally limited to one team, and returns the best matches first. When has_next_page is true, pass end_cursor as cursor to get the next page. Use to find an existing issue before creating a duplicate; use Get Issue when the identifier is already known. Linear limits search to 30 requests per minute, and a just-created issue can take a moment to appear. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    term: Property.ShortText({
      displayName: 'Search Text',
      description: 'Words to look for, for example "login timeout".',
      required: true,
    }),
    team_id: {
      ...props.team_id(false),
      description: 'Only return issues from this team. Leave empty to search every team you can access.',
    },
    include_comments: Property.Checkbox({
      displayName: 'Also Search Comments',
      required: false,
      defaultValue: false,
    }),
    include_archived: Property.Checkbox({
      displayName: 'Include Archived Issues',
      required: false,
      defaultValue: false,
    }),
    limit: Property.Number({
      displayName: 'Max Results',
      description: 'How many issues to return, 1 to 100. Default 25.',
      required: false,
      defaultValue: 25,
    }),
    cursor: Property.ShortText({
      displayName: 'Cursor',
      description: 'End Cursor from a previous search. Empty for the first page.',
      required: false,
    }),
  },
  outputSchema: issueSearchOutputSchema,
  async run({ auth, propsValue }) {
    const term = propsValue.term.trim();
    if (term.length === 0) {
      throw new Error('Search Text cannot be empty.');
    }
    const data = await linearGraphql.request<{
      searchIssues: LinearConnection<LinearIssueNode> & { totalCount: number };
    }>({
      auth,
      query: SEARCH_ISSUES_QUERY,
      variables: {
        term,
        first: linearGraphql.clampLimit({ value: propsValue.limit, fallback: 25, max: 100 }),
        after: propsValue.cursor?.trim() || undefined,
        includeComments: propsValue.include_comments === true,
        includeArchived: propsValue.include_archived === true,
        filter: propsValue.team_id ? { team: { id: { eq: propsValue.team_id } } } : undefined,
      },
    });
    return {
      ...linearMappers.toPage({ connection: data.searchIssues, map: linearMappers.flattenIssue }),
      total_count: data.searchIssues.totalCount,
    };
  },
});
