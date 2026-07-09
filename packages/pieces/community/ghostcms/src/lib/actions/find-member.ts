import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

import { ghostAuth } from '../..';
import { common } from '../common';

export const findMember = createAction({
  name: 'find_member',
  displayName: 'Find Member',
  description: 'Find a member by email',
  audience: 'both',
  aiMetadata: { description: 'Looks up Ghost members filtered by an exact email address and returns the matches. Use to check whether a member exists or to resolve a member id before updating. Read-only and idempotent.', idempotent: true },
  auth: ghostAuth,
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      required: true,
    }),
  },

  async run(context) {
    const response = await httpClient.sendRequest({
      url: `${context.auth.props.baseUrl}/ghost/api/admin/members`,
      method: HttpMethod.GET,
      headers: {
        Authorization: `Ghost ${common.jwtFromApiKey(context.auth.props.apiKey)}`,
      },
      queryParams: {
        filter: `email:${context.propsValue.email}`,
      },
    });

    return response.body;
  },
});
