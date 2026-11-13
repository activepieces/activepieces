import { createAction } from '@activepieces/pieces-framework';
import { gitlabAuth } from '../../auth';
import { adminProps } from '../../common/admin';
import { gitlabListPage, projectPath } from '../../common/client';
import { gitlabProps, optionalText, pagingInput } from '../../common/props';
import { projectUserListOutputSchema } from '../../output-schemas-admin';

export const listProjectUsersAction = createAction({
  auth: gitlabAuth,
  name: 'list_project_users',
  displayName: 'List Project Users',
  description: 'Lists the users who can be mentioned or assigned in a project.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description: 'Lists the users of a GitLab project (everyone who can be assigned or mentioned there), with optional name or username search, without roles. Returns one page plus nextPage/hasMore. Use List Project Members to see access levels.',
    idempotent: true,
  },
  props: {
    projectId: gitlabProps.projectId(),
    search: adminProps.search('Matches name and username.'),
    page: gitlabProps.page(),
    perPage: gitlabProps.perPage(),
  },
  outputSchema: projectUserListOutputSchema,
  async run({ auth, propsValue }) {
    return gitlabListPage({ auth, 
      path: `${projectPath(propsValue.projectId)}/users`,
      query: { search: optionalText(propsValue.search) },
      ...pagingInput({ page: propsValue.page, perPage: propsValue.perPage }),
    });
  },
});
