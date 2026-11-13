import { createAction, Property } from '@activepieces/pieces-framework';
import { discourseAuth } from '../../auth';
import { discourseOps } from '../../common/operations';
import { discourseSchemas } from '../../common/schemas';

export const addGroupMembersAction = createAction({
  auth: discourseAuth,
  name: 'add_group_members',
  classification: 'WRITE',
  displayName: 'Add Group Members',
  description: 'Adds users to a Discourse group by group ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Add users (by username) to a Discourse group by numeric group ID (from List Groups). Needs group owner or admin rights. Users who are already members or do not exist come back in skipped_usernames, so retries are safe.',
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
      remove: false,
    });
  },
});
