import { createAction } from '@activepieces/pieces-framework';
import { gitlabAuth } from '../../auth';
import { adminProps, groupPath } from '../../common/admin';
import { gitlabListPage } from '../../common/client';
import { gitlabProps, pagingInput } from '../../common/props';
import { pendingMemberListOutputSchema } from '../../output-schemas-admin';

export const listGroupPendingMembersAction = createAction({
  auth: gitlabAuth,
  name: 'list_group_pending_members',
  displayName: 'List Group Pending Members',
  description: 'Lists the members of a top-level group waiting for approval.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description: 'Lists members of a top-level GitLab group (and its subgroups and projects) that are awaiting Owner approval, for example because of a user cap, including pending email invitations. Requires the Owner role on a top-level group. Returns one page plus nextPage/hasMore.',
    idempotent: true,
  },
  props: {
    groupId: adminProps.groupId('Numeric ID or path of a top-level group.'),
    page: gitlabProps.page(),
    perPage: gitlabProps.perPage(),
  },
  outputSchema: pendingMemberListOutputSchema,
  async run({ auth, propsValue }) {
    return gitlabListPage({ auth, 
      path: `${groupPath(propsValue.groupId)}/pending_members`,
      ...pagingInput({ page: propsValue.page, perPage: propsValue.perPage }),
    });
  },
});
