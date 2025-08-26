import { biginAuth } from '../../index';
import { createAction, Property } from '@activepieces/pieces-framework';
import { biginApiService } from '../common/request';

export const searchUser = createAction({
  auth: biginAuth,
  name: 'searchUser',
  displayName: 'Search User',
  description: 'Locate users by email.',
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: 'User email address (full or partial, case-insensitive match)',
      required: true,
    }),
    type: Property.StaticDropdown({
      displayName: 'User Type (optional)',
      required: false,
      options: {
        options: [
          { label: 'All Users', value: 'AllUsers' },
          { label: 'Active Users', value: 'ActiveUsers' },
          { label: 'Deactive Users', value: 'DeactiveUsers' },
          { label: 'Confirmed Users', value: 'ConfirmedUsers' },
          { label: 'Not Confirmed Users', value: 'NotConfirmedUsers' },
          { label: 'Deleted Users', value: 'DeletedUsers' },
          { label: 'Active Confirmed Users', value: 'ActiveConfirmedUsers' },
          { label: 'Admin Users', value: 'AdminUsers' },
          { label: 'Active Confirmed Admins', value: 'ActiveConfirmedAdmins' },
          { label: 'Current User', value: 'CurrentUser' },
        ],
      },
    }),
    page: Property.Number({
      displayName: 'Page',
      required: false,
      description: 'Page index (default 1)',
    }),
    per_page: Property.Number({
      displayName: 'Per Page',
      required: false,
      description: 'Records per page (max 200, default 200)',
    }),
  },
  async run({ auth, propsValue }) {
    const { access_token, api_domain } = auth as any;
    const emailTerm = String(propsValue.email || '').toLowerCase();

    const params: any = {};
    if (propsValue.type) params.type = propsValue.type as string;
    if (propsValue.page) params.page = Number(propsValue.page);
    if (propsValue.per_page) params.per_page = Number(propsValue.per_page);

    const resp = await biginApiService.fetchUsers(access_token, api_domain, params);

    const users = Array.isArray(resp.users) ? resp.users : [];
    const filtered = users.filter((u: any) => String(u.email || '').toLowerCase().includes(emailTerm));

    return {
      message: 'User search completed successfully',
      count: filtered.length,
      data: filtered,
    };
  },
});


