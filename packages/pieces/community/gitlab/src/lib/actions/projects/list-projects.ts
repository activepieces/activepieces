import { createAction, Property } from '@activepieces/pieces-framework';
import { gitlabAuth } from '../../auth';
import { adminProps } from '../../common/admin';
import { gitlabListPage } from '../../common/client';
import { gitlabProps, optionalText, pagingInput, triStateValue } from '../../common/props';
import { projectListOutputSchema } from '../../output-schemas-admin';

export const projectOrderBy = () =>
  Property.StaticDropdown({
    displayName: 'Order By',
    required: false,
    options: {
      options: [
        { label: 'Created At', value: 'created_at' },
        { label: 'Last Activity', value: 'last_activity_at' },
        { label: 'Name', value: 'name' },
        { label: 'Path', value: 'path' },
        { label: 'Updated At', value: 'updated_at' },
        { label: 'ID', value: 'id' },
      ],
    },
  });

export const listProjectsAction = createAction({
  auth: gitlabAuth,
  name: 'list_projects',
  displayName: 'List Projects',
  description: 'Lists projects you are a member of, one page at a time.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description: 'Lists GitLab projects the connected user is a member of (Member Only defaults to yes), with optional name search, owned-only, archived and visibility filters. Member Only can be set to no only together with Search or Owned Only, because gitlab.com would otherwise return every public project. Returns one page plus nextPage/hasMore.',
    idempotent: true,
  },
  props: {
    search: adminProps.search('Matches project name and path.'),
    membership: gitlabProps.triState('Member Only', 'Defaults to yes. Set to no only together with Search or Owned Only.'),
    owned: gitlabProps.triState('Owned Only', 'Only projects owned by the connected user.'),
    archived: gitlabProps.triState('Archived', 'Yes = only archived, No = only active, empty = both.'),
    visibility: adminProps.visibility('Only projects with this visibility.'),
    orderBy: projectOrderBy(),
    sort: gitlabProps.sort(),
    page: gitlabProps.page(),
    perPage: gitlabProps.perPage(),
  },
  outputSchema: projectListOutputSchema,
  async run({ auth, propsValue }) {
    const search = optionalText(propsValue.search);
    const owned = triStateValue(propsValue.owned);
    const membership = triStateValue(propsValue.membership) ?? true;
    if (!membership && search === undefined && owned !== true) {
      throw new Error('Member Only can be turned off only together with Search or Owned Only; otherwise gitlab.com returns every public project.');
    }
    return gitlabListPage({ auth, 
      path: '/projects',
      query: {
        membership: membership ? true : undefined,
        search,
        owned,
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
