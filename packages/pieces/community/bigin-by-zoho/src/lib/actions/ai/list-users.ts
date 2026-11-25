import { createAction, Property } from '@activepieces/pieces-framework';
import { biginAuth } from '../../auth';
import { biginApiService, getBiginConnection, isObject } from '../../common/request';
import { biginOutputSchemas } from '../../common/output-schemas';

function pickRef(value: unknown): { id: unknown; name: unknown } | null {
  return isObject(value) ? { id: value['id'], name: value['name'] } : null;
}

export const biginListUsersAi = createAction({
  auth: biginAuth,
  name: 'bigin_list_users',
  classification: 'READ',
  displayName: 'List Users (Agent)',
  description: 'List users of the Bigin org.',
  audience: 'ai',
  outputSchema: biginOutputSchemas.aiListUsers,
  aiMetadata: {
    description:
      'Lists users of the Bigin org with id, name, email, role, profile and status. Use to resolve an Owner ID before creating or updating records. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    type: Property.StaticDropdown({
      displayName: 'User Type',
      description: 'Which users to return (default: all users).',
      required: false,
      options: {
        options: [
          { label: 'All Users', value: 'AllUsers' },
          { label: 'Active Users', value: 'ActiveUsers' },
          { label: 'Admin Users', value: 'AdminUsers' },
          { label: 'Current User', value: 'CurrentUser' },
        ],
      },
    }),
    page: Property.Number({ displayName: 'Page', description: 'Page number, starting at 1.', required: false }),
  },
  async run(context) {
    const { accessToken, apiDomain } = getBiginConnection(context.auth);
    const response = await biginApiService.fetchUsers(accessToken, apiDomain, {
      type: context.propsValue.type ?? undefined,
      page: context.propsValue.page ?? undefined,
      per_page: 200,
    });
    const body = isObject(response) ? response : {};
    const users = Array.isArray(body['users']) ? body['users'].filter(isObject) : [];
    const info = isObject(body['info']) ? body['info'] : {};
    return {
      users: users.map((u) => ({
        id: u['id'],
        full_name: u['full_name'],
        email: u['email'],
        status: u['status'],
        role: pickRef(u['role']),
        profile: pickRef(u['profile']),
      })),
      more_records: info['more_records'] === true,
    };
  },
});
