import {
  createAction,
  Property,
  spreadIfDefined,
} from '@activepieces/pieces-framework';
import { ninetyAuth } from '../auth';
import { ninetyCommon } from '../common/client';
import { ninetyProps } from '../common/props';
import { issueListOutputSchema } from '../common/output-schemas';

export const findIssues = createAction({
  auth: ninetyAuth,
  name: 'find_issues',
  classification: 'SEARCH',
  displayName: 'Find Issues',
  description: 'Search Ninety issues by team, term or text',
  audience: 'both',
  aiMetadata: {
    description:
      'Searches Ninety issues and returns the matching page, newest first by default. Filter by team and by term to separate the weekly list from the parking lot. Read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: issueListOutputSchema,
  props: {
    teamId: ninetyProps.teamIdOptional,
    intervalCode: ninetyProps.intervalCode,
    searchText: Property.ShortText({
      displayName: 'Search Text',
      description: 'Matches the title, description and comments',
      required: false,
    }),
    sortField: Property.StaticDropdown({
      displayName: 'Sort By',
      required: false,
      defaultValue: 'createdDate',
      options: {
        options: [
          { label: 'Created date', value: 'createdDate' },
          { label: 'Completed date', value: 'completedDate' },
          { label: 'Archived date', value: 'archivedDate' },
          { label: 'Due date', value: 'dueDate' },
          { label: 'Title', value: 'title' },
          { label: 'Priority', value: 'priority' },
          { label: 'Term', value: 'intervalCode' },
          { label: 'Likes', value: 'numOfLikes' },
          { label: 'Team', value: 'team' },
          { label: 'Owner', value: 'user' },
        ],
      },
    }),
    sortDirection: Property.StaticDropdown({
      displayName: 'Order',
      required: false,
      defaultValue: 'DESC',
      options: {
        options: [
          { label: 'Newest or highest first', value: 'DESC' },
          { label: 'Oldest or lowest first', value: 'ASC' },
        ],
      },
    }),
    pageIndex: ninetyProps.pageIndex,
    pageSize: Property.Number({
      displayName: 'Page Size',
      description: 'How many issues to return. Ninety defaults to 10.',
      required: false,
      min: 1,
    }),
  },
  async run({ auth, propsValue }) {
    const { items, totalCount } = await ninetyCommon.queryIssues({
      token: auth.secret_text,
      query: {
        ...spreadIfDefined('teamId', propsValue.teamId),
        ...spreadIfDefined('intervalCode', propsValue.intervalCode),
        ...spreadIfDefined('searchText', propsValue.searchText),
        ...spreadIfDefined('sortField', propsValue.sortField),
        ...spreadIfDefined('sortDirection', propsValue.sortDirection),
        ...spreadIfDefined('pageIndex', propsValue.pageIndex),
        ...spreadIfDefined('pageSize', propsValue.pageSize),
      },
    });

    return { issues: items, count: items.length, totalCount };
  },
});
