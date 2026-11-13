import { createAction, Property } from '@activepieces/pieces-framework';
import { gitlabAuth } from '../../auth';
import { adminProps, optionalAccessLevel } from '../../common/admin';
import { gitlabListPage } from '../../common/client';
import { gitlabProps, optionalText, pagingInput, triStateValue } from '../../common/props';
import { groupListOutputSchema } from '../../output-schemas-admin';

export const listGroupsAction = createAction({
  auth: gitlabAuth,
  name: 'list_groups',
  displayName: 'List Groups',
  description: 'Lists the groups you are a member of, one page at a time.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description: 'Lists GitLab groups and subgroups the connected user is a member of, with optional search, owned-only, top-level-only and minimum access level filters. Search can miss a group created moments ago; use Get Group by path for that. Returns one page plus nextPage/hasMore.',
    idempotent: true,
  },
  props: {
    search: adminProps.search('Matches group name and path.'),
    owned: gitlabProps.triState('Owned Only', 'Only groups the connected user owns.'),
    topLevelOnly: gitlabProps.triState('Top-Level Only', 'Hide subgroups.'),
    minAccessLevel: adminProps.accessLevel('Minimum Access Level', false, 'Only groups where the connected user has at least this role.'),
    orderBy: Property.StaticDropdown({
      displayName: 'Order By',
      required: false,
      options: { options: [{ label: 'Name', value: 'name' }, { label: 'Path', value: 'path' }, { label: 'ID', value: 'id' }] },
    }),
    sort: gitlabProps.sort(),
    page: gitlabProps.page(),
    perPage: gitlabProps.perPage(),
  },
  outputSchema: groupListOutputSchema,
  async run({ auth, propsValue }) {
    return gitlabListPage({ auth, 
      path: '/groups',
      query: {
        search: optionalText(propsValue.search),
        owned: triStateValue(propsValue.owned),
        top_level_only: triStateValue(propsValue.topLevelOnly),
        min_access_level: optionalAccessLevel({ value: propsValue.minAccessLevel, label: 'Minimum Access Level' }),
        order_by: propsValue.orderBy,
        sort: propsValue.sort,
      },
      ...pagingInput({ page: propsValue.page, perPage: propsValue.perPage }),
    });
  },
});
