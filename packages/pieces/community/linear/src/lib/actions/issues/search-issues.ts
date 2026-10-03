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
  description: 'Search issue titles and descriptions for your words.',
  audience: 'both',
  aiMetadata: {
    description:
      'Runs a Linear full-text and semantic search over issue titles and descriptions (optionally comments), optionally limited to one team, and returns the best matches first. When has_next_page is true, pass end_cursor as cursor to get the next page. Use to find an existing issue before creating a duplicate; use Get Issue when the identifier is already known. Linear limits search to 30 requests per minute, and a just-created issue can take a moment to appear. Read-only and idempotent. labels_complete is false when Linear did not return every label page; label_ids and label_names then hold only the labels read.',
    idempotent: true,
  },
  propertyGroups: [
    { key: 'search', display: 'section', label: 'Search', icon: 'filter', props: ['term', 'team_id'] },
    {
      key: 'results',
      display: 'section',
      label: 'Results',
      icon: 'sliders',
      props: ['include_comments', 'include_archived', 'limit'],
    },
  ],
  props: {
    term: Property.ShortText({
      displayName: 'Search Text',
      placeholder: 'login timeout',
      required: true,
    }),
    team_id: {
      ...props.team_id(false),
      description: 'Only return issues from this team. Empty: every team.',
    },
    include_comments: Property.Checkbox({
      displayName: 'Include Comments',
      description: 'Also match words in issue comments.',
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
      description: 'How many issues to return, up to 100. Empty: 25.',
      required: false,
      defaultValue: 25,
      display: 'stepper',
      min: 1,
      max: 100,
      step: 1,
    }),
    cursor: Property.ShortText({
      displayName: 'Cursor',
      description: 'The end_cursor of the previous search. Empty: first page.',
      required: false,
      advanced: true,
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
    const nodes = await linearGraphql.withAllIssuesLabels({ auth, issues: data.searchIssues.nodes });
    return {
      ...linearMappers.toPage({ connection: { ...data.searchIssues, nodes }, map: linearMappers.flattenIssue }),
      total_count: data.searchIssues.totalCount,
    };
  },
});
