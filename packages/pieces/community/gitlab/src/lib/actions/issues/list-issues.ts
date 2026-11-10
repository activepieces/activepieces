import { createAction, Property } from '@activepieces/pieces-framework';
import { gitlabAuth } from '../../auth';
import { gitlabListPage, projectPath } from '../../common/client';
import {
  gitlabProps,
  optionalIsoDate,
  optionalPositiveInt,
  optionalText,
  pagingInput,
  stringList,
} from '../../common/props';
import { issueListOutputSchema } from '../../output-schemas';

export const listIssuesAction = createAction({
  auth: gitlabAuth,
  name: 'list_issues',
  displayName: 'List Issues',
  description: 'Lists or searches the issues of a project, one page at a time.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists issues in a GitLab project with optional filters (state, labels, text search, assignee, author, milestone, updated after). Returns one page plus nextPage/hasMore; call again with nextPage to continue. Use to find an issue IID before Get Issue or Update Issue.',
    idempotent: true,
  },
  props: {
    projectId: gitlabProps.projectId(),
    state: Property.StaticDropdown({
      displayName: 'State',
      required: false,
      options: {
        options: [
          { label: 'Opened', value: 'opened' },
          { label: 'Closed', value: 'closed' },
          { label: 'All', value: 'all' },
        ],
      },
    }),
    search: Property.ShortText({
      displayName: 'Search',
      description: 'Matches title and description.',
      required: false,
    }),
    labels: Property.Array({
      displayName: 'Labels',
      description: 'Issues must have all of these labels.',
      required: false,
    }),
    assigneeId: Property.Number({
      displayName: 'Assignee User ID',
      required: false,
    }),
    authorId: Property.Number({
      displayName: 'Author User ID',
      required: false,
    }),
    milestone: Property.ShortText({
      displayName: 'Milestone Title',
      required: false,
    }),
    updatedAfter: Property.ShortText({
      displayName: 'Updated After',
      description: 'ISO 8601 date-time.',
      required: false,
    }),
    orderBy: Property.StaticDropdown({
      displayName: 'Order By',
      required: false,
      options: {
        options: [
          { label: 'Created At', value: 'created_at' },
          { label: 'Updated At', value: 'updated_at' },
          { label: 'Due Date', value: 'due_date' },
          { label: 'Priority', value: 'priority' },
        ],
      },
    }),
    sort: gitlabProps.sort(),
    page: gitlabProps.page(),
    perPage: gitlabProps.perPage(),
  },
  outputSchema: issueListOutputSchema,
  async run({ auth, propsValue }) {
    return gitlabListPage({
      auth,
      path: `${projectPath(propsValue.projectId)}/issues`,
      query: {
        state: propsValue.state,
        search: optionalText(propsValue.search),
        labels: stringList({ value: propsValue.labels, label: 'Labels' })?.join(
          ','
        ),
        assignee_id: optionalPositiveInt({
          value: propsValue.assigneeId,
          label: 'Assignee User ID',
        }),
        author_id: optionalPositiveInt({
          value: propsValue.authorId,
          label: 'Author User ID',
        }),
        milestone: optionalText(propsValue.milestone),
        updated_after: optionalIsoDate({
          value: propsValue.updatedAfter,
          label: 'Updated After',
        }),
        order_by: propsValue.orderBy,
        sort: propsValue.sort,
      },
      ...pagingInput({ page: propsValue.page, perPage: propsValue.perPage }),
    });
  },
});
