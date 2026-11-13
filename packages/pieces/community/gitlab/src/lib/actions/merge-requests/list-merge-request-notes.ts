import { createAction, Property } from '@activepieces/pieces-framework';
import { gitlabAuth } from '../../auth';
import { gitlabListPage, projectPath } from '../../common/client';
import {
  gitlabProps,
  pagingInput,
  requirePositiveInt,
} from '../../common/props';
import { noteListOutputSchema } from '../../output-schemas';

export const listMergeRequestNotesAction = createAction({
  auth: gitlabAuth,
  name: 'list_merge_request_notes',
  displayName: 'List Merge Request Comments',
  description: 'Lists the comments (notes) of a merge request.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists comments on a GitLab merge request, including system notes. Returns one page plus nextPage/hasMore. Use List Merge Request Discussions to see comments grouped into threads.',
    idempotent: true,
  },
  props: {
    projectId: gitlabProps.projectId(),
    mergeRequestIid: gitlabProps.mergeRequestIid(),
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
      value: propsValue.mergeRequestIid,
      label: 'Merge Request IID',
    });
    return gitlabListPage({
      auth,
      path: `${projectPath(propsValue.projectId)}/merge_requests/${iid}/notes`,
      query: { order_by: propsValue.orderBy, sort: propsValue.sort },
      ...pagingInput({ page: propsValue.page, perPage: propsValue.perPage }),
    });
  },
});
