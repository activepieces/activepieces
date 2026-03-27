import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { savvyCalApiCall } from '../common';
import { savvyCalAuth } from '../../';

export const getCurrentUserAction = createAction({
  auth: savvyCalAuth,
  name: 'get_current_user',
  displayName: 'Get Current User',
  description: 'Retrieves the profile of the currently authenticated SavvyCal user.',
  props: {},
  async run(context) {
    const response = await savvyCalApiCall<{
      id: string;
      name: string;
      email: string;
      slug: string | null;
      time_zone: string | null;
      created_at: string;
      updated_at: string;
    }>({
      token: context.auth.secret_text,
      method: HttpMethod.GET,
      path: '/me',
    });

    const user = response.body;
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      slug: user.slug ?? null,
      time_zone: user.time_zone ?? null,
      created_at: user.created_at,
      updated_at: user.updated_at ?? null,
    };
  },
});
