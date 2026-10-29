import { createAction } from '@activepieces/pieces-framework';
import { gitlabAuth } from '../../auth';
import { adminProps, optionalAccessLevel } from '../../common/admin';
import { gitlabListPage, projectPath } from '../../common/client';
import { gitlabProps, optionalText, pagingInput, triStateValue } from '../../common/props';
import { groupRefListOutputSchema } from '../../output-schemas-admin';

export const listProjectGroupsAction = createAction({
  auth: gitlabAuth,
  name: 'list_project_groups',
  displayName: 'List Project Ancestor Groups',
  description: 'Lists the groups a project belongs to (its parent groups), optionally with the groups it is shared with.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description: 'Lists the ancestor groups of a GitLab project (its parent group chain), and with Include Shared Groups also the groups it is shared with. Returns one page plus nextPage/hasMore. Use List Project Invited Groups for only the shared groups.',
    idempotent: true,
  },
  props: {
    projectId: gitlabProps.projectId(),
    search: adminProps.search(),
    withShared: gitlabProps.triState('Include Shared Groups', 'Also list groups the project is shared with.'),
    sharedMinAccessLevel: adminProps.accessLevel('Shared Minimum Access Level', false, 'Only shared groups with at least this access.'),
    page: gitlabProps.page(),
    perPage: gitlabProps.perPage(),
  },
  outputSchema: groupRefListOutputSchema,
  async run({ auth, propsValue }) {
    return gitlabListPage({ auth, 
      path: `${projectPath(propsValue.projectId)}/groups`,
      query: {
        search: optionalText(propsValue.search),
        with_shared: triStateValue(propsValue.withShared),
        shared_min_access_level: optionalAccessLevel({ value: propsValue.sharedMinAccessLevel, label: 'Shared Minimum Access Level' }),
      },
      ...pagingInput({ page: propsValue.page, perPage: propsValue.perPage }),
    });
  },
});
