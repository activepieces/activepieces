import { createAction } from '@activepieces/pieces-framework';
import { gitlabAuth } from '../../auth';
import { adminProps, optionalAccessLevel } from '../../common/admin';
import { gitlabListPage, projectPath } from '../../common/client';
import { gitlabProps, optionalText, pagingInput } from '../../common/props';
import { groupRefListOutputSchema } from '../../output-schemas-admin';

export const listProjectInvitedGroupsAction = createAction({
  auth: gitlabAuth,
  name: 'list_project_invited_groups',
  displayName: 'List Project Invited Groups',
  description: 'Lists the groups a project has been shared with.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description: 'Lists the groups a GitLab project is shared with (invited groups), with optional name search and minimum access level. Returns one page plus nextPage/hasMore. Share a project with Share Project With Group.',
    idempotent: true,
  },
  props: {
    projectId: gitlabProps.projectId(),
    search: adminProps.search(),
    minAccessLevel: adminProps.accessLevel('Minimum Access Level', false, 'Only groups where the connected user has at least this access.'),
    page: gitlabProps.page(),
    perPage: gitlabProps.perPage(),
  },
  outputSchema: groupRefListOutputSchema,
  async run({ auth, propsValue }) {
    return gitlabListPage({ auth, 
      path: `${projectPath(propsValue.projectId)}/invited_groups`,
      query: {
        search: optionalText(propsValue.search),
        min_access_level: optionalAccessLevel({ value: propsValue.minAccessLevel, label: 'Minimum Access Level' }),
      },
      ...pagingInput({ page: propsValue.page, perPage: propsValue.perPage }),
    });
  },
});
