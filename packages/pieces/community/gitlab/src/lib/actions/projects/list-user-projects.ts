import { createAction } from '@activepieces/pieces-framework';
import { gitlabAuth } from '../../auth';
import { adminProps } from '../../common/admin';
import { gitlabListPage } from '../../common/client';
import { gitlabProps, optionalText, pagingInput, requirePositiveInt, triStateValue } from '../../common/props';
import { projectListOutputSchema } from '../../output-schemas-admin';
import { projectOrderBy } from './list-projects';

export const listUserProjectsAction = createAction({
  auth: gitlabAuth,
  name: 'list_user_projects',
  displayName: 'List User Projects',
  description: 'Lists the projects owned by a user that you can see.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description: 'Lists GitLab projects in a given user personal namespace that the connected user can see, with optional search, archived and visibility filters. Takes a numeric user ID (find it with List Users). Returns one page plus nextPage/hasMore.',
    idempotent: true,
  },
  props: {
    userId: adminProps.userId(),
    search: adminProps.search('Matches project name and path.'),
    archived: gitlabProps.triState('Archived', 'Yes = only archived, No = only active, empty = both.'),
    visibility: adminProps.visibility('Only projects with this visibility.'),
    orderBy: projectOrderBy(),
    sort: gitlabProps.sort(),
    page: gitlabProps.page(),
    perPage: gitlabProps.perPage(),
  },
  outputSchema: projectListOutputSchema,
  async run({ auth, propsValue }) {
    const userId = requirePositiveInt({ value: propsValue.userId, label: 'User ID' });
    return gitlabListPage({ auth, 
      path: `/users/${userId}/projects`,
      query: {
        search: optionalText(propsValue.search),
        archived: triStateValue(propsValue.archived),
        visibility: propsValue.visibility,
        order_by: propsValue.orderBy,
        sort: propsValue.sort,
        simple: true,
      },
      ...pagingInput({ page: propsValue.page, perPage: propsValue.perPage }),
    });
  },
});
