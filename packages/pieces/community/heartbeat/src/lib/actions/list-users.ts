import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { heartbeatAuth } from '../auth';
import { heartbeatApi } from '../common/client';
import { heartbeatProps } from '../common/props';
import { heartbeatOutputSchemas } from '../common/output-schemas';
import { heartbeatUsers } from '../common/users';

export const listUsersAction = createAction({
  auth: heartbeatAuth,
  name: 'heartbeat_list_users',
  classification: 'SEARCH',
  displayName: 'List Members',
  description: 'Lists community members, optionally filtered by text, group, role or admin status.',
  audience: 'both',
  aiMetadata: {
    description: 'Lists community members with name, email, role, groups and last login, optionally filtered by name/email text, group ID, role name or admin flag. Use to find a member ID or email before updating, messaging or grouping them. totalMatching counts every match even when the list is cut at the limit. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    search: Property.ShortText({ displayName: 'Name or Email Contains', description: 'Case-insensitive text to match in the name or email.', required: false }),
    groupId: heartbeatProps.id({ displayName: 'Group ID', description: 'Only members of this group. Use List Groups to find the ID.', required: false }),
    role: Property.ShortText({ displayName: 'Role Name', description: 'Only members with this role, for example Administrator, Moderator or User (see List Roles).', required: false }),
    adminsOnly: Property.Checkbox({ displayName: 'Admins Only', required: false, defaultValue: false }),
    includeProfileDetails: Property.Checkbox({
      displayName: 'Include Profile Details',
      description: 'Also return LinkedIn data and onboarding answers (larger output).',
      required: false,
      defaultValue: false,
    }),
    limit: heartbeatProps.limit({ max: 1000, defaultValue: 100 }),
  },
  outputSchema: heartbeatOutputSchemas.userList,
  async run({ auth, propsValue }) {
    const max = heartbeatApi.limit({ value: propsValue.limit, max: 1000, defaultValue: 100 });
    const groupId = heartbeatApi.optionalUuid({ value: propsValue.groupId, label: 'Group ID' });
    const search = heartbeatApi.optionalText(propsValue.search)?.trim().toLowerCase();
    const role = heartbeatApi.optionalText(propsValue.role)?.trim().toLowerCase();
    const users = heartbeatApi.recordList(
      await heartbeatApi.request<unknown>({ token: auth.secret_text, method: HttpMethod.GET, path: '/users', operation: 'list members' }),
    );
    const matching = users.filter((user) => {
      if (search && !`${String(user['name'] ?? '')} ${String(user['email'] ?? '')}`.toLowerCase().includes(search)) {
        return false;
      }
      if (role && String(user['role'] ?? '').toLowerCase() !== role) {
        return false;
      }
      if (propsValue.adminsOnly === true && user['isAdmin'] !== true) {
        return false;
      }
      if (groupId && !heartbeatApi.recordList(user['groups']).some((group) => group['id'] === groupId)) {
        return false;
      }
      return true;
    });
    const page = matching.slice(0, max).map((user) =>
      propsValue.includeProfileDetails === true ? user : heartbeatUsers.withoutProfileDetails(user),
    );
    return { users: page, count: page.length, totalMatching: matching.length, truncated: matching.length > page.length };
  },
});
