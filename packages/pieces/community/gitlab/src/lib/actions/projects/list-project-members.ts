import { createAction } from '@activepieces/pieces-framework';
import { gitlabAuth } from '../../auth';
import { adminProps } from '../../common/admin';
import { gitlabListPage, projectPath } from '../../common/client';
import { gitlabProps, optionalText, pagingInput } from '../../common/props';
import { memberListOutputSchema } from '../../output-schemas-admin';

export const listProjectMembersAction = createAction({
  auth: gitlabAuth,
  name: 'list_project_members',
  displayName: 'List Project Members',
  description: 'Lists the members of a project, including members inherited from its groups.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description: 'Lists every member of a GitLab project with their access level (10 Guest, 20 Reporter, 30 Developer, 40 Maintainer, 50 Owner), including members inherited from parent groups and shared groups. Optional name search. Returns one page plus nextPage/hasMore.',
    idempotent: true,
  },
  props: {
    projectId: gitlabProps.projectId(),
    query: adminProps.search('Matches name, username or public email.'),
    page: gitlabProps.page(),
    perPage: gitlabProps.perPage(),
  },
  outputSchema: memberListOutputSchema,
  async run({ auth, propsValue }) {
    return gitlabListPage({ auth, 
      path: `${projectPath(propsValue.projectId)}/members/all`,
      query: { query: optionalText(propsValue.query) },
      ...pagingInput({ page: propsValue.page, perPage: propsValue.perPage }),
    });
  },
});
