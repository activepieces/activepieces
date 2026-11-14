import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { savvyCalApiCall } from '../common';
import { savvyCalAuth, getToken } from '../auth';

export const getCurrentUserAction = createAction({
  auth: savvyCalAuth,
  name: 'get_current_user',
  classification: 'READ',
  displayName: 'Get Current User',
  description: 'Retrieves the profile of the currently authenticated SavvyCal user.',
  audience: 'both',
  aiMetadata: { description: 'Returns the profile of the SavvyCal account the connection is authenticated as (id, name, email, time zone, time format, plan). Use to identify the current user or fetch their default time zone. Read-only and idempotent.', idempotent: true },
  props: {},
  async run(context) {
    const response = await savvyCalApiCall<SavvyCalUser>({
      token: getToken(context.auth),
      method: HttpMethod.GET,
      path: '/me',
    });

    const user = response.body;
    return {
      id: user.id,
      name: user.display_name ?? null,
      first_name: user.first_name ?? null,
      last_name: user.last_name ?? null,
      email: user.email,
      time_zone: user.time_zone ?? null,
      time_format: user.time_format ?? null,
      first_day_of_week: user.first_day_of_week === 0 ? 'sunday' : user.first_day_of_week === 1 ? 'monday' : null,
      plan: user.plan ?? null,
      avatar_url: user.avatar_url ?? null,
    };
  },
});

type SavvyCalUser = {
  id: string;
  email: string;
  display_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  time_zone?: string | null;
  time_format?: string | null;
  first_day_of_week?: number | null;
  plan?: string | null;
  avatar_url?: string | null;
};
