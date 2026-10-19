import { createAction } from '@activepieces/pieces-framework';
import { gitlabAuth } from '../../auth';
import { adminProps, groupPath } from '../../common/admin';
import { gitlabListPage } from '../../common/client';
import { gitlabProps, optionalText, pagingInput, triStateValue } from '../../common/props';
import { projectListOutputSchema } from '../../output-schemas-admin';
import { projectOrderBy } from './list-projects';

export const listGroupProjectsAction = createAction({
  auth: gitlabAuth,
  name: 'list_group_projects',
  displayName: 'List Group Projects',
  description: 'Lists the projects of a group, one page at a time.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description: 'Lists the projects in a GitLab group, optionally including its subgroups, with search, archived and visibility filters. Returns one page plus nextPage/hasMore.',
    idempotent: true,
  },
  props: {
    groupId: adminProps.groupId(),
    search: adminProps.search('Matches project name and path.'),
    includeSubgroups: gitlabProps.triState('Include Subgroups', 'Also list projects in subgroups.'),
    archived: gitlabProps.triState('Archived', 'Yes = only archived, No = only active, empty = both.'),
    visibility: adminProps.visibility('Only projects with this visibility.'),
    orderBy: projectOrderBy(),
    sort: gitlabProps.sort(),
    page: gitlabProps.page(),
    perPage: gitlabProps.perPage(),
  },
  outputSchema: projectListOutputSchema,
  async run({ auth, propsValue }) {
    return gitlabListPage({ auth, 
      path: `${groupPath(propsValue.groupId)}/projects`,
      query: {
        search: optionalText(propsValue.search),
        include_subgroups: triStateValue(propsValue.includeSubgroups),
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
