import { createAction, Property } from '@activepieces/pieces-framework';
import { discourseAuth } from '../auth';
import { discourseOps } from '../common/operations';
import { discourseProps } from '../common/props';
import { discourseSchemas } from '../common/schemas';

export const addUsersToGroup = createAction({
  auth: discourseAuth,
  name: 'add_users_to_group',
  classification: 'WRITE',
  description: 'Add users to a group',
  audience: 'human',
  aiMetadata: {
    description:
      'Add users by username to a Discourse group picked from a dropdown. Agents should use Add Group Members, which takes the group ID as text. Users who are already members or do not exist are reported as skipped, so retries are safe.',
    idempotent: true,
  },
  displayName: 'Add Users to Group',
  props: {
    group_id: discourseProps.groupDropdown(),
    users: Property.Array({
      description: 'Usernames to add to the group',
      displayName: 'Users',
      required: true,
    }),
  },
  outputSchema: discourseSchemas.groupMembership,
  async run({ auth, propsValue }) {
    return discourseOps.changeGroupMembers({
      auth: auth.props,
      groupId: propsValue.group_id,
      usernames: propsValue.users,
      remove: false,
    });
  },
});
