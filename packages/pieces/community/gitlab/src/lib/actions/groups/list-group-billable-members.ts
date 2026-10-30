import { createAction, Property } from '@activepieces/pieces-framework';
import { gitlabAuth } from '../../auth';
import { adminProps, groupPath } from '../../common/admin';
import { gitlabListPage } from '../../common/client';
import { gitlabProps, optionalText, pagingInput } from '../../common/props';
import { billableMemberListOutputSchema } from '../../output-schemas-admin';

export const listGroupBillableMembersAction = createAction({
  auth: gitlabAuth,
  name: 'list_group_billable_members',
  displayName: 'List Group Billable Members',
  description: 'Lists the members who count toward the paid seats of a top-level group.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description: 'Lists the billable members (used seats) of a top-level GitLab group, including members of its subgroups and projects, with last activity. Only works on a top-level group and requires the Owner role. Returns one page plus nextPage/hasMore.',
    idempotent: true,
  },
  props: {
    groupId: adminProps.groupId('Numeric ID or path of a top-level group.'),
    search: adminProps.search('Matches name, username or email.'),
    sort: Property.StaticDropdown({
      displayName: 'Sort',
      required: false,
      options: {
        options: [
          { label: 'Last activity, newest first', value: 'last_activity_on_desc' },
          { label: 'Last activity, oldest first', value: 'last_activity_on_asc' },
          { label: 'Name A-Z', value: 'name_asc' },
          { label: 'Name Z-A', value: 'name_desc' },
        ],
      },
    }),
    page: gitlabProps.page(),
    perPage: gitlabProps.perPage(),
  },
  outputSchema: billableMemberListOutputSchema,
  async run({ auth, propsValue }) {
    return gitlabListPage({ auth, 
      path: `${groupPath(propsValue.groupId)}/billable_members`,
      query: { search: optionalText(propsValue.search), sort: propsValue.sort },
      ...pagingInput({ page: propsValue.page, perPage: propsValue.perPage }),
      statusMessages: { 400: 'Billable members are only available on a top-level group' },
    });
  },
});
