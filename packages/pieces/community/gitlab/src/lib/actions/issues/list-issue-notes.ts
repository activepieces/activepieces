import { createAction, Property } from '@activepieces/pieces-framework';
import { gitlabAuth } from '../../auth';
import { gitlabListPage, projectPath } from '../../common/client';
import {
  gitlabProps,
  pagingInput,
  requirePositiveInt,
} from '../../common/props';
import { noteListOutputSchema } from '../../output-schemas';

export const listIssueNotesAction = createAction({
  auth: gitlabAuth,
  name: 'list_issue_notes',
  displayName: 'List Issue Comments',
  description: 'Lists the comments (notes) of an issue, one page at a time.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists comments on a GitLab issue, including system notes such as label or state changes. Returns one page plus nextPage/hasMore. Use to read a discussion or find a note ID for Update or Delete Issue Comment.',
    idempotent: true,
  },
  props: {
    projectId: gitlabProps.projectId(),
    issueIid: gitlabProps.issueIid(),
    orderBy: Property.StaticDropdown({
      displayName: 'Order By',
      required: false,
      options: {
        options: [
          { label: 'Created At', value: 'created_at' },
          { label: 'Updated At', value: 'updated_at' },
        ],
      },
    }),
    sort: gitlabProps.sort(),
    page: gitlabProps.page(),
    perPage: gitlabProps.perPage(),
  },
  outputSchema: noteListOutputSchema,
  async run({ auth, propsValue }) {
    const iid = requirePositiveInt({
      value: propsValue.issueIid,
      label: 'Issue IID',
    });
    return gitlabListPage({
      auth,
      path: `${projectPath(propsValue.projectId)}/issues/${iid}/notes`,
      query: { order_by: propsValue.orderBy, sort: propsValue.sort },
      ...pagingInput({ page: propsValue.page, perPage: propsValue.perPage }),
    });
  },
});
