import { createAction } from '@activepieces/pieces-framework';
import { gitlabAuth } from '../../auth';
import { adminProps } from '../../common/admin';
import { gitlabListPage, projectPath } from '../../common/client';
import { gitlabProps, optionalText, pagingInput } from '../../common/props';
import { groupRefListOutputSchema } from '../../output-schemas-admin';

export const listProjectShareLocationsAction = createAction({
  auth: gitlabAuth,
  name: 'list_project_share_locations',
  displayName: 'List Project Share Locations',
  description: 'Lists the groups a project can be shared with.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description: 'Lists the groups the connected user may share a GitLab project with. Returns one page plus nextPage/hasMore. Use to find a group ID for Share Project With Group.',
    idempotent: true,
  },
  props: {
    projectId: gitlabProps.projectId(),
    search: adminProps.search(),
    page: gitlabProps.page(),
    perPage: gitlabProps.perPage(),
  },
  outputSchema: groupRefListOutputSchema,
  async run({ auth, propsValue }) {
    return gitlabListPage({ auth, 
      path: `${projectPath(propsValue.projectId)}/share_locations`,
      query: { search: optionalText(propsValue.search) },
      ...pagingInput({ page: propsValue.page, perPage: propsValue.perPage }),
    });
  },
});
