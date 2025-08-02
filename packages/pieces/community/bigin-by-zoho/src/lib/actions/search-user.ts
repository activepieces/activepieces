import { createAction, Property } from '@activepieces/pieces-framework';
import { biginAuth } from '../common/auth';
import { BiginClient } from '../common/client';

export const searchUserAction = createAction({
  auth: biginAuth,
  name: 'search_user',
  displayName: 'Search User',
  description: 'Search for users by email',
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Email address to search for',
      required: true
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of users to return (default: 200)',
      required: false,
      defaultValue: 200
    })
  },
  async run(context) {
    const { email, limit } = context.propsValue;
    const client = new BiginClient(context.auth);

    try {
      // Get all users and filter by email
      const response = await client.getUsers({
        per_page: (limit || 200).toString()
      });

      const users = response.users || [];
      const filteredUsers = users.filter((user: any) => 
        user.email && user.email.toLowerCase().includes(email.toLowerCase())
      );

      return {
        success: true,
        data: filteredUsers,
        total: filteredUsers.length
      };
    } catch (error: any) {
      throw new Error(`Failed to search users: ${error.message}`);
    }
  }
});
