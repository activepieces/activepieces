import { createAction } from '@activepieces/pieces-framework';
import { gitlabAuth } from '../../auth';
import { adminProps } from '../../common/admin';
import { gitlabListPage, projectPath } from '../../common/client';
import { gitlabProps, optionalText, pagingInput } from '../../common/props';
import { groupRefListOutputSchema } from '../../output-schemas-admin';

export const listProjectTransferLocationsAction = createAction({
  auth: gitlabAuth,
  name: 'list_project_transfer_locations',
  displayName: 'List Project Transfer Locations',
  description: 'Lists the groups a project can be moved to.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description: 'Lists the groups the connected user may transfer (move) a GitLab project to. Read-only; it does not move anything. Returns one page plus nextPage/hasMore.',
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
      path: `${projectPath(propsValue.projectId)}/transfer_locations`,
      query: { search: optionalText(propsValue.search) },
      ...pagingInput({ page: propsValue.page, perPage: propsValue.perPage }),
    });
  },
});
