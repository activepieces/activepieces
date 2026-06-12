import { createAction } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import { travelCodeAuth } from '../../index';
import { travelCodeCommon } from '../common';

export const getCurrentUser = createAction({
  auth: travelCodeAuth,
  name: 'get_current_user',
  displayName: 'Get Current User',
  description:
    'Retrieve the profile of the authenticated user (email, name, role, and flags).',
  audience: 'both',
  aiMetadata: {
    description:
      'Returns the authenticated Travel Code user profile, including email, name, company, currency, role, and permission flags. Read-only and idempotent.',
    idempotent: true,
  },
  props: {},
  async run(context) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${travelCodeCommon.baseUrl}/user/me`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.access_token,
      },
    });
    return response.body;
  },
});
