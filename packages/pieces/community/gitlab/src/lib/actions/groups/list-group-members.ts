import { createAction } from '@activepieces/pieces-framework';
import { gitlabAuth } from '../../auth';
import { adminProps, groupPath } from '../../common/admin';
import { gitlabListPage } from '../../common/client';
import { gitlabProps, optionalText, pagingInput } from '../../common/props';
import { memberListOutputSchema } from '../../output-schemas-admin';

export const listGroupMembersAction = createAction({
  auth: gitlabAuth,
  name: 'list_group_members',
  displayName: 'List Group Members',
  description: 'Lists the members of a group, one page at a time.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description: 'Lists members of a GitLab group with their access level. Only direct members by default; set Include Inherited to add members inherited from parent groups. Optional name search. Returns one page plus nextPage/hasMore.',
    idempotent: true,
  },
  props: {
    groupId: adminProps.groupId(),
    includeInherited: gitlabProps.triState('Include Inherited', 'Also list members inherited from parent groups.'),
    query: adminProps.search('Matches name, username or public email.'),
    page: gitlabProps.page(),
    perPage: gitlabProps.perPage(),
  },
  outputSchema: memberListOutputSchema,
  async run({ auth, propsValue }) {
    const scope = propsValue.includeInherited === 'true' ? 'members/all' : 'members';
    return gitlabListPage({ auth, 
      path: `${groupPath(propsValue.groupId)}/${scope}`,
      query: { query: optionalText(propsValue.query) },
      ...pagingInput({ page: propsValue.page, perPage: propsValue.perPage }),
    });
  },
});
