import { createAction, Property } from '@activepieces/pieces-framework';
import { discourseAuth } from '../../auth';
import { discourseOps } from '../../common/operations';
import { discourseSchemas } from '../../common/schemas';

export const removeGroupMembersAction = createAction({
  auth: discourseAuth,
  name: 'remove_group_members',
  classification: 'DESTRUCTIVE',
  displayName: 'Remove Group Members',
  description: 'Removes users from a Discourse group.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Remove users (by username) from a Discourse group by numeric group ID, which takes away the access the group grants. Needs group owner or admin rights; only call on an explicit request. Users who were not members come back in skipped_usernames, so retries are safe.',
    idempotent: true,
  },
  props: {
    group_id: Property.ShortText({ displayName: 'Group ID', description: 'Numeric group ID.', required: true }),
    usernames: Property.Array({ displayName: 'Usernames', required: true }),
  },
  outputSchema: discourseSchemas.groupMembership,
  async run({ auth, propsValue }) {
    return discourseOps.changeGroupMembers({
      auth: auth.props,
      groupId: propsValue.group_id,
      usernames: propsValue.usernames,
      remove: true,
    });
  },
});
