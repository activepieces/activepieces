import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

import { ghostAuth } from '../auth';
import { common } from '../common';
import { ghostCommon } from '../common/client';
import { ghostOriginalFindUserOutputSchema } from '../output-schemas';

export const findUser = createAction({
  name: 'find_user',
  outputSchema: ghostOriginalFindUserOutputSchema,
  classification: 'READ',
  displayName: 'Find User',
  description: 'Find a staff user by email',
  audience: 'human',
  aiMetadata: { description: 'Looks up Ghost staff users (authors/admins, not members) filtered by an exact email address and returns the matches. Use to resolve a staff user id, e.g. to set as a post author. Read-only and idempotent.', idempotent: true },
  auth: ghostAuth,
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      required: true,
    }),
  },

  async run(context) {
    const response = await httpClient.sendRequest({
      url: `${context.auth.props.baseUrl}/ghost/api/admin/users`,
      method: HttpMethod.GET,
      headers: {
        Authorization: `Ghost ${common.jwtFromApiKey(context.auth.props.apiKey)}`,
      },
      queryParams: {
        filter: `email:${ghostCommon.nqlString(context.propsValue.email.trim())}`,
      },
    });

    return response.body;
  },
});
