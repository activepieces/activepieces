import { createAction, Property } from '@activepieces/pieces-framework';
import { gitlabAuth } from '../../auth';
import { gitlabListPage, projectPath } from '../../common/client';
import { gitlabProps, optionalText, pagingInput } from '../../common/props';
import { tagListOutputSchema } from '../../output-schemas';

export const listTagsAction = createAction({
  auth: gitlabAuth,
  name: 'list_tags',
  displayName: 'List Tags',
  description: 'Lists or searches the tags of the repository.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists tags of a GitLab repository with their commit and release notes, optionally filtered by a search term (^term or term$ match the start or end). Returns one page plus nextPage/hasMore.',
    idempotent: true,
  },
  props: {
    projectId: gitlabProps.projectId(),
    search: Property.ShortText({ displayName: 'Search', required: false }),
    orderBy: Property.StaticDropdown({
      displayName: 'Order By',
      required: false,
      options: {
        options: [
          { label: 'Updated', value: 'updated' },
          { label: 'Name', value: 'name' },
          { label: 'Version', value: 'version' },
        ],
      },
    }),
    sort: gitlabProps.sort(),
    page: gitlabProps.page(),
    perPage: gitlabProps.perPage(),
  },
  outputSchema: tagListOutputSchema,
  async run({ auth, propsValue }) {
    return gitlabListPage({
      auth,
      path: `${projectPath(propsValue.projectId)}/repository/tags`,
      query: {
        search: optionalText(propsValue.search),
        order_by: propsValue.orderBy,
        sort: propsValue.sort,
      },
      ...pagingInput({ page: propsValue.page, perPage: propsValue.perPage }),
    });
  },
});
